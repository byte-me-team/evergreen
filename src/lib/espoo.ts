import { prisma } from "@/lib/prisma";
import {
  callFeatherlessEventSuggestions,
  NormalizedPreferences,
  EventSuggestions,
  FeatherlessConcurrencyError,
} from "@/lib/featherless";
import { spawn } from "child_process";
import { join } from "path";

const EVENT_SUGGESTION_WINDOW_DAYS = Number(
  process.env.ESPOO_EVENTS_WINDOW_DAYS ?? "10"
);
const EVENT_SUGGESTION_LIMIT = Number(
  process.env.ESPOO_EVENTS_LIMIT ?? "25"
);
const EVENT_SUGGESTION_MODEL_LIMIT = Number(
  process.env.ESPOO_EVENTS_MODEL_LIMIT ?? "25"
);
const EVENT_SUGGESTION_CACHE_TTL_MS =
  Number(process.env.ESPOO_SUGGESTION_CACHE_TTL_HOURS ?? "24") *
  60 *
  60 *
  1000;

const TSX_BINARY = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);

let backgroundIngestPromise: Promise<void> | null = null;
const espooGenerationPromises = new Map<string, Promise<SuggestionJobResult>>();

function runEspooIngestor(logPrefix: string): Promise<void> {
  if (!backgroundIngestPromise) {
    console.info(`${logPrefix} Starting fallback Espoo ingestion via ${TSX_BINARY}`);
    backgroundIngestPromise = new Promise((resolve, reject) => {
      const child = spawn(TSX_BINARY, ["scripts/ingest-espoo.ts"], {
        cwd: process.cwd(),
        env: process.env,
      });

      child.stdout?.on("data", (chunk) => {
        console.info(`${logPrefix} [ingest stdout] ${chunk.toString().trim()}`);
      });

      child.stderr?.on("data", (chunk) => {
        console.error(`${logPrefix} [ingest stderr] ${chunk.toString().trim()}`);
      });

      child.on("error", (error) => {
        backgroundIngestPromise = null;
        reject(error);
      });

      child.on("close", (code) => {
        backgroundIngestPromise = null;
        if (code === 0) {
          console.info(`${logPrefix} Espoo ingestion finished successfully`);
          resolve();
        } else {
          reject(new Error(`Espoo ingestion exited with code ${code}`));
        }
      });
    });
  } else {
    console.info(`${logPrefix} Waiting for existing Espoo ingestion to finish`);
  }

  return backgroundIngestPromise!;
}

type EventSuggestionWithContext = EventSuggestions & {
  recommendations: Array<
    EventSuggestions["recommendations"][number] & {
      event: {
        title: string;
        summary: string | null;
        startTime: string;
        endTime: string | null;
        location: string | null;
        price: string | null;
        sourceUrl: string | null;
      };
    }
  >;
};

type SuggestionJobResult = {
  payload: EventSuggestionWithContext;
  usedFallback: boolean;
  retryAfterMs?: number;
};

export type EspooSuggestionResponse = {
  suggestions: EventSuggestionWithContext;
  source: "cache" | "fresh" | "fallback";
  retryAfterMs?: number;
};

async function generateFreshEspooSuggestions(
  userId: string,
  preferences: NormalizedPreferences,
  now: Date,
  logPrefix: string
): Promise<SuggestionJobResult> {
  const end = new Date(
    now.getTime() + EVENT_SUGGESTION_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  console.info(
    `${logPrefix} Fetching up to ${EVENT_SUGGESTION_LIMIT} events between ${now.toISOString()} and ${end.toISOString()}`
  );

  const fetchEvents = () =>
    prisma.event.findMany({
      where: {
        startTime: {
          gte: now,
          lt: end,
        },
      },
      orderBy: { startTime: "asc" },
      take: EVENT_SUGGESTION_LIMIT,
    });

  let events = await fetchEvents();

  if (!events.length) {
    console.warn(
      `${logPrefix} No events found locally. Triggering fallback ingestion.`
    );
    try {
      await runEspooIngestor(logPrefix);
    } catch (error) {
      console.error(`${logPrefix} Failed to run fallback ingestion`, error);
      throw new Error(
        "Couldn't refresh Espoo events right now. Please try again shortly."
      );
    }

    events = await fetchEvents();

    if (!events.length) {
      console.warn(
        `${logPrefix} Still no events after ingestion. Returning empty list.`
      );
      return { recommendations: [] };
    }
  }

  const eventsForModel = events.slice(0, EVENT_SUGGESTION_MODEL_LIMIT);

  console.info(
    `${logPrefix} Sending ${eventsForModel.length}/${events.length} events to Featherless`
  );

  if (!eventsForModel.length) {
    console.warn(`${logPrefix} No events available for ranking after filtering.`);
    return { recommendations: [] };
  }

  let baseSuggestions: EventSuggestions;
  let usedFallback = false;
  let retryAfterMs: number | undefined;
  try {
    baseSuggestions = await callFeatherlessEventSuggestions(
      preferences,
      eventsForModel.map((event) => ({
        id: event.sourceId,
        title: event.title,
        summary: event.summary,
        description: event.description,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime?.toISOString() ?? undefined,
        location:
          event.locationName || event.locationAddress || event.city || undefined,
        price: event.price ?? undefined,
        tags: event.tags,
        source_url: event.sourceUrl ?? undefined,
      }))
    );
  } catch (error) {
    console.error(`${logPrefix} Featherless failed, using fallback`, error);
    usedFallback = true;
    if (error instanceof FeatherlessConcurrencyError) {
      retryAfterMs = 2000;
    }
    baseSuggestions = {
      recommendations: eventsForModel.slice(0, 3).map((event) => ({
        event_id: event.sourceId,
        title: event.title,
        reason:
          "Showing upcoming Espoo events while Featherless catches up. Check details to see if they fit your interests.",
        confidence: 0.25,
      })),
    };
  }

  const eventById = new Map(events.map((evt) => [evt.sourceId, evt]));
  console.info(`${logPrefix} Featherless returned ${baseSuggestions.recommendations.length} recommendations`);

  const sortedRecommendations = [...baseSuggestions.recommendations].sort(
    (a, b) => b.confidence - a.confidence
  );

  const resolved: EventSuggestionWithContext = {
    recommendations: sortedRecommendations
      .map((rec) => {
        const event = eventById.get(rec.event_id);
        if (!event) return null;
        return {
          ...rec,
          event: {
            title: event.title,
            summary: event.summary ?? null,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime ? event.endTime.toISOString() : null,
            location:
              event.locationName || event.locationAddress || event.city || null,
            price: event.price ?? null,
            sourceUrl: event.sourceUrl ?? null,
          },
        };
      })
      .filter((rec): rec is NonNullable<typeof rec> => Boolean(rec)),
  };

  if (!usedFallback) {
    await prisma.espooSuggestionCache.upsert({
      where: { userId },
      create: {
        userId,
        suggestionsJson: resolved,
        generatedAt: new Date(),
      },
      update: {
        suggestionsJson: resolved,
        generatedAt: new Date(),
      },
    });
  } else {
    console.info(`${logPrefix} Skipping cache update because fallback suggestions were used`);
  }

  return {
    payload: resolved,
    usedFallback,
    retryAfterMs,
  };
}

export async function getEspooEventSuggestionsForUser(
  userId: string
): Promise<EspooSuggestionResponse> {
  const logPrefix = `[EspooSuggestions][user=${userId}]`;

  const prefsRecord = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefsRecord) {
    throw new Error("User preferences not found. Complete onboarding first.");
  }

  const preferences = prefsRecord.normalizedJson as NormalizedPreferences;
  const now = new Date();

  const cached = await prisma.espooSuggestionCache.findUnique({
    where: { userId },
  });

  if (cached) {
    const ageMs = now.getTime() - cached.generatedAt.getTime();
    if (ageMs < EVENT_SUGGESTION_CACHE_TTL_MS) {
      console.info(
        `${logPrefix} Serving cached recommendations (age ${Math.round(
          ageMs / 1000
        )}s)`
      );
      return {
        suggestions: cached.suggestionsJson as EventSuggestionWithContext,
        source: "cache",
      };
    }

    console.info(
      `${logPrefix} Cached recommendations expired (${Math.round(
        ageMs / 1000
      )}s old), refreshing`
    );
  }

  if (espooGenerationPromises.has(userId)) {
    console.info(
      `${logPrefix} Waiting for in-flight Featherless suggestions to finish`
    );
    const inflight = await espooGenerationPromises.get(userId)!;
    return {
      suggestions: inflight.payload,
      source: inflight.usedFallback ? "fallback" : "fresh",
      retryAfterMs: inflight.retryAfterMs,
    };
  }

  const generationPromise = generateFreshEspooSuggestions(
    userId,
    preferences,
    now,
    logPrefix
  ).finally(() => {
    espooGenerationPromises.delete(userId);
  });

  espooGenerationPromises.set(userId, generationPromise);
  const result = await generationPromise;
  return {
    suggestions: result.payload,
    source: result.usedFallback ? "fallback" : "fresh",
    retryAfterMs: result.retryAfterMs,
  };
}
