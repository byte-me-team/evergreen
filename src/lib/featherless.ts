import { z } from "zod";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
if (!FEATHERLESS_API_KEY) {
  throw new Error("FEATHERLESS_API_KEY is not set");
}

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1/completions";
const MODEL_NAME = "Qwen/Qwen2.5-72B-Instruct";

// ------------- Schemas -------------

const InterestSchema = z.object({
  name: z.string(),
  type: z
    .enum(["physical", "mental", "social", "digital", "creative", "other"])
    .optional(),
  tags: z.array(z.string()).default([]),
  solo_or_social: z.enum(["solo", "social", "either"]).optional(),
});

export const NormalizedPreferencesSchema = z.object({
  interests: z.array(InterestSchema),
});

export type NormalizedPreferences = z.infer<typeof NormalizedPreferencesSchema>;

const JointActivitySchema = z.object({
  title: z.string(),
  description: z.string(),
  why_it_matches: z.string(),
  uses_user1_interests: z.array(z.string()),
  uses_user2_interests: z.array(z.string()),
});

export const JointActivitiesSchema = z.object({
  activities: z.array(JointActivitySchema),
});

export type JointActivities = z.infer<typeof JointActivitiesSchema>;

// ------------- Low-level HTTP caller -------------

async function callFeatherlessRaw(prompt: string): Promise<string> {
  const res = await fetch(FEATHERLESS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt,
      max_tokens: 1500,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Featherless error: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const data = (await res.json()) as any;

  const text = data.choices?.[0]?.text;
  if (!text || typeof text !== "string") {
    throw new Error("Invalid Featherless response: missing choices[0].text");
  }

  return text.trim();
}

// ------------- High-level helpers -------------

const NORMALIZE_SYSTEM_INSTRUCTIONS = `
You are a data normalizer for an activity-matching app.
Extract a structured JSON object from the user's free-text description of what they like to do.

Return JSON only:
{
  "interests": [
    {
      "name": string,
      "type": "physical" | "mental" | "social" | "digital" | "creative" | "other",
      "tags": string[],
      "solo_or_social": "solo" | "social" | "either"
    }
  ]
}
No explanation.
`.trim();

export async function callFeatherlessNormalize(
  rawText: string
): Promise<NormalizedPreferences> {
  const fullPrompt = `
${NORMALIZE_SYSTEM_INSTRUCTIONS}

User text:
${rawText}

Return JSON only.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch (err) {
    throw new Error("Failed to parse normalize JSON: " + (err as Error).message);
  }

  return NormalizedPreferencesSchema.parse(parsed);
}

const MATCH_SYSTEM_INSTRUCTIONS = `
You generate shared activity suggestions between two people.

Input:
Two JSON objects, each containing a person's normalized interests.

Output:
Valid JSON ONLY:
{
  "activities": [
    {
      "title": string,
      "description": string,
      "why_it_matches": string,
      "uses_user1_interests": string[],
      "uses_user2_interests": string[]
    }
  ]
}
`.trim();

export async function callFeatherlessJointActivities(
  user1Prefs: NormalizedPreferences,
  user2Prefs: NormalizedPreferences
): Promise<JointActivities> {
  const fullPrompt = `
${MATCH_SYSTEM_INSTRUCTIONS}

User 1:
${JSON.stringify(user1Prefs, null, 2)}

User 2:
${JSON.stringify(user2Prefs, null, 2)}

Return JSON only.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch (err) {
    throw new Error("Failed to parse joint activities JSON: " + (err as Error).message);
  }

  return JointActivitiesSchema.parse(parsed);
}
