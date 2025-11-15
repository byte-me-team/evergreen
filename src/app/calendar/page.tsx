/** @jsxImportSource react */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MatchedSuggestion,
  SuggestionMeta,
  fetchMatchedSuggestions,
  markSuggestionAttendance,
} from "@/lib/client/matched-suggestions";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";

const AUTO_REFRESH_DELAY_MS = 8000;

type DayBucket = {
  date: Date;
  key: string;
  label: string;
};

function startOfWeek(date: Date) {
  const clone = new Date(date);
  const day = clone.getDay();
  const diff = (day + 6) % 7; // Monday start
  clone.setDate(clone.getDate() - diff);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function buildWeekBuckets(anchor: Date = new Date()): DayBucket[] {
  const buckets: DayBucket[] = [];
  const start = startOfWeek(anchor);
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    buckets.push({
      date: day,
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    });
  }
  return buckets;
}

export default function CalendarPage() {
  const { user, isLoading } = useRequireAuth();
  const [suggestions, setSuggestions] = useState<MatchedSuggestion[]>([]);
  const [meta, setMeta] = useState<SuggestionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [fetchReady, setFetchReady] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasCompletedFetch, setHasCompletedFetch] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setFetchReady(false);
      lastFetchKeyRef.current = null;
      setHasCompletedFetch(false);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
      setMeta(null);
      setError(null);
      setRefreshNonce(0);
      return;
    }

    setFetchReady(true);
    setRefreshNonce((value) => value + 1);
  }, [user?.email]);

  useEffect(() => {
    if (!fetchReady || !user?.email) {
      return;
    }

    const fetchKey = `${user.email}:${refreshNonce}`;
    if (lastFetchKeyRef.current === fetchKey) {
      setIsLoadingSuggestions(false);
      setHasCompletedFetch(true);
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    let cancelled = false;
    let completed = false;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    setIsLoadingSuggestions(true);
    setError(null);

    fetchMatchedSuggestions(user.email)
      .then(({ recommendations, meta }) => {
        if (cancelled) return;
        setSuggestions(recommendations);
        setMeta(meta);
        if ((meta.status === "running" || meta.missing > 0) && !cancelled) {
          refreshTimeoutRef.current = setTimeout(() => {
            setRefreshNonce((value) => value + 1);
          }, AUTO_REFRESH_DELAY_MS);
        }
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "We couldn't fetch suggestions right now."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingSuggestions(false);
        setHasCompletedFetch(true);
        completed = true;
      });

    return () => {
      cancelled = true;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (!completed && lastFetchKeyRef.current === fetchKey) {
        lastFetchKeyRef.current = null;
      }
    };
  }, [fetchReady, user?.email, refreshNonce]);

  const handleToggleGoing = useCallback(
    async (suggestion: MatchedSuggestion) => {
      try {
        setActioningId(suggestion.id);
        await markSuggestionAttendance(suggestion.id, !suggestion.isGoing);
        setRefreshNonce((value) => value + 1);
      } catch (toggleError) {
        setError(
          toggleError instanceof Error
            ? toggleError.message
            : "Failed to update selection."
        );
      } finally {
        setActioningId(null);
      }
    },
    []
  );

  const weekBuckets = useMemo(() => buildWeekBuckets(new Date()), []);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, MatchedSuggestion[]>();
    for (const suggestion of suggestions) {
      const date = new Date(suggestion.event.startTime);
      const key = date.toISOString().slice(0, 10);
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(suggestion);
      } else {
        map.set(key, [suggestion]);
      }
    }
    return map;
  }, [suggestions]);

  const weekLabel = useMemo(() => {
    const firstDay = weekBuckets[0]?.date;
    if (!firstDay) return "";
    return firstDay.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
    });
  }, [weekBuckets]);

  if (isLoading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading calendar…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Week of {weekLabel}
          </p>
          <h1 className="text-3xl font-semibold">Calendar</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/suggestions">Browse more suggestions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
        {meta?.status === "running" && (
          <p className="text-sm text-muted-foreground">
            Updating matches in the background. This view auto-refreshes.
          </p>
        )}
      </div>

      {error && (
        <article className="rounded-2xl border border-border bg-card/70 p-4 text-sm text-destructive">
          {error}
        </article>
      )}

      {isLoadingSuggestions && !hasCompletedFetch && (
        <div>
          <p className="text-sm text-muted-foreground">
            Loading your week’s events…
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {weekBuckets.map((bucket) => {
          const daySuggestions = eventsByDay.get(bucket.key) ?? [];
          return (
            <div
              key={bucket.key}
              className="flex min-h-[260px] flex-col rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm"
            >
              <div className="mb-4">
                <p className="text-sm font-semibold">{bucket.label}</p>
                <p className="text-xs text-muted-foreground">
                  {daySuggestions.length
                    ? `${daySuggestions.length} ${daySuggestions.length === 1 ? "event" : "events"}`
                    : "No matches yet"}
                </p>
              </div>
              <div className="flex-1 space-y-3">
                {daySuggestions.map((suggestion) => {
                  const date = new Date(suggestion.event.startTime);
                  const timeLabel = date.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const cardClass = `rounded-2xl border p-3 text-sm transition-colors ${
                    suggestion.isGoing
                      ? "border-primary bg-primary/15 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                      : "border-border/70 bg-background/70"
                  }`;
                  return (
                    <div key={suggestion.id} className={cardClass}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] uppercase text-muted-foreground">
                            {timeLabel}
                          </p>
                          <p className="font-semibold leading-snug">
                            {suggestion.event.title}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col items-center gap-2">
                        <Button
                          className="w-full justify-center"
                          size="sm"
                          variant={suggestion.isGoing ? "default" : "outline"}
                          onClick={() => handleToggleGoing(suggestion)}
                          disabled={actioningId === suggestion.id}
                        >
                          {suggestion.isGoing ? "Going" : "I'm going"}
                        </Button>
                        {suggestion.isGoing && (
                          <p className="text-center text-[11px] italic text-muted-foreground">
                            Invite a relative to join (coming soon).
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
