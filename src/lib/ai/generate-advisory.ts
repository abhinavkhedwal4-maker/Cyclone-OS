import { createServerFn } from "@tanstack/react-start";
import type { Audience, Severity } from "@/lib/cyclone/types";

export type AdvisoryDraftInput = {
  regionName: string;
  country: string;
  stormName: string;
  wind: number;
  pressure: number;
  rainfall: number;
  etaHours: number;
  waterM: number;
  people: number;
  flooded: string;
  severity: Severity;
  audience: Audience;
  confidence: number;
};

export type AdvisoryDraft = {
  headline: string;
  summary: string;
  actions: string[];
  severity: Severity;
  confidence: number;
  source: string;
};

type DraftResult =
  | { ok: true; draft: AdvisoryDraft }
  | { ok: false; error: string };

function parseDraft(raw: string): Omit<AdvisoryDraft, "source"> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(raw.slice(start, end + 1)) as Partial<AdvisoryDraft>;
    if (!json.headline || !json.summary || !Array.isArray(json.actions)) return null;
    const severity =
      json.severity === "EMERGENCY" || json.severity === "WARNING" || json.severity === "WATCH"
        ? json.severity
        : "WARNING";
    return {
      headline: String(json.headline).slice(0, 160),
      summary: String(json.summary).slice(0, 600),
      actions: json.actions.map(String).slice(0, 5),
      severity,
      confidence: Math.min(0.99, Math.max(0.4, Number(json.confidence) || 0.8)),
    };
  } catch {
    return null;
  }
}

function promptFor(data: AdvisoryDraftInput) {
  const who =
    data.audience === "health"
      ? "district health department"
      : data.audience === "grid"
        ? "power utility control room"
        : "municipal disaster commissioner";
  return `You are a Bay of Bengal cyclone desk officer. Draft a short operational advisory for the ${who}.
Return ONLY JSON with keys: headline, summary, actions (array of 3 imperative sentences), severity (WATCH|WARNING|EMERGENCY), confidence (0-1).
Context:
- Place: ${data.regionName}, ${data.country}
- Storm: ${data.stormName}
- Wind ${data.wind} km/h, pressure ${data.pressure} hPa, rainfall ${data.rainfall} mm
- ETA ${data.etaHours} h, water line ${data.waterM.toFixed(1)} m
- People exposed ~${Math.round(data.people)}
- Assets below the line: ${data.flooded}
- Model severity ${data.severity}, model confidence ${data.confidence}
Tone: clipped, specific, no metaphors, no markdown.`;
}

// Model fallback order: try the env-configured model first, then progressively
// older stable releases. Gemini 2.5-flash is v1beta only and the exact model ID
// must match what your project has enabled in Google AI Studio.
const GEMINI_FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGemini(key: string, model: string, prompt: string): Promise<DraftResult | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  // 404 = model not found for this project; return null to try next fallback
  if (res.status === 404) return null;
  if (!res.ok) return { ok: false, error: `Gemini error ${res.status}` };
  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseDraft(text);
  if (!parsed) return { ok: false, error: "Gemini returned an unreadable draft" };
  return { ok: true, draft: { ...parsed, source: `Gemini ${model}` } };
}

async function draftWithGemini(prompt: string): Promise<DraftResult | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const envModel = process.env.GEMINI_MODEL?.trim();
  const models = envModel
    ? [envModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== envModel)]
    : GEMINI_FALLBACK_MODELS;

  for (const model of models) {
    const result = await callGemini(key, model, prompt);
    if (result !== null) return result; // null = 404, try next
  }
  return { ok: false, error: "No Gemini model available for this project" };
}

async function draftWithGrok(prompt: string): Promise<DraftResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ok: false, error: "AI is not available in this environment" };
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.35,
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return { ok: false, error: `xAI API error ${res.status}` };
  const body = (await res.json()) as { choices: { message: { content: string } }[] };
  const parsed = parseDraft(body.choices[0]?.message.content ?? "");
  if (!parsed) return { ok: false, error: "Model returned an unreadable draft" };
  return { ok: true, draft: { ...parsed, source: "Grok 4.5" } };
}

export const generateAdvisory = createServerFn({ method: "POST" })
  .validator((input: AdvisoryDraftInput) => input)
  .handler(async ({ data }): Promise<DraftResult> => {
    const prompt = promptFor(data);
    try {
      const gemini = await draftWithGemini(prompt);
      if (gemini) return gemini;
      return await draftWithGrok(prompt);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Advisory generation failed",
      };
    }
  });
