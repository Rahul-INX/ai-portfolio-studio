import { decryptApiKey } from "@/lib/ai-key-crypto";

export type AiProvider = "GEMINI" | "OPENAI" | "ANTHROPIC" | "XAI";
export type ProviderCandidate = {
  provider: AiProvider;
  model: string;
  apiKey: string;
  maxOutputTokens: number;
  dailyRequestLimit?: number;
};
export type ProviderPrompt = {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  temperature?: number;
  jsonSchema?: unknown;
  timeoutMs?: number;
  enforceQuota?: boolean;
};
export type ProviderResult = { text: string; provider: AiProvider; model: string };
export type DiscoveredModel = { id: string; label: string };

type Fetcher = typeof fetch;

export type ProviderFailureReason = "missing-api-key" | "provider-error" | "empty-response" | "refusal" | "incomplete-response" | "timeout" | "rate-limit";

export class ProviderCallError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly reason: ProviderFailureReason = "provider-error") {
    super(message);
  }
}

type QuotaConsumer = (provider: AiProvider, limit: number) => Promise<boolean>;

export async function consumeProviderQuota(provider: AiProvider, limit: number, now = new Date()) {
  if (!process.env.DATABASE_URL) return true;
  const { prisma } = await import("@/lib/prisma");
  const day = now.toISOString().slice(0, 10);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "AiUsageBucket" ("provider", "day", "count", "updatedAt")
    VALUES (${provider}::"AiProviderType", CAST(${day} AS date), 1, NOW())
    ON CONFLICT ("provider", "day") DO UPDATE
      SET "count" = "AiUsageBucket"."count" + 1, "updatedAt" = NOW()
      WHERE "AiUsageBucket"."count" < ${limit}
    RETURNING "count"
  `;
  return rows.length === 1;
}

function discoveryRequest(provider: AiProvider, apiKey: string) {
  if (provider === "GEMINI") {
    return ["https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", { headers: { "x-goog-api-key": apiKey } }] as const;
  }
  if (provider === "ANTHROPIC") {
    return ["https://api.anthropic.com/v1/models?limit=1000", { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } }] as const;
  }
  return [
    provider === "OPENAI" ? "https://api.openai.com/v1/models" : "https://api.x.ai/v1/language-models",
    { headers: { Authorization: `Bearer ${apiKey}` } },
  ] as const;
}

export async function discoverModels(
  provider: AiProvider,
  apiKey: string,
  fetcher: Fetcher = fetch,
): Promise<DiscoveredModel[]> {
  const [url, init] = discoveryRequest(provider, apiKey);
  const response = await fetcher(url, init);
  if (!response.ok) throw new ProviderCallError(`Provider model discovery failed (${response.status}).`, true);
  const payload = await response.json() as Record<string, unknown>;
  const rows = (provider === "XAI" ? payload.models : provider === "GEMINI" ? payload.models : payload.data) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(rows)) throw new ProviderCallError("Provider returned an invalid model list.", true);

  return rows.flatMap((row) => {
    const rawId = typeof row.id === "string" ? row.id : typeof row.name === "string" ? row.name : "";
    const id = rawId.replace(/^models\//, "");
    if (!id) return [];
    if (provider === "GEMINI" && !(row.supportedGenerationMethods as unknown[] | undefined)?.includes("generateContent")) return [];
    if (provider === "OPENAI" && !/^(gpt-|o[1-9]|chatgpt-)/i.test(id)) return [];
    return [{ id, label: typeof row.display_name === "string" ? row.display_name : id }];
  }).sort((a, b) => a.label.localeCompare(b.label));
}

function requestFor(candidate: ProviderCandidate, prompt: ProviderPrompt): [string, RequestInit] {
  const maxOutputTokens = Math.max(1, Math.min(candidate.maxOutputTokens, 8192));
  if (candidate.provider === "GEMINI") {
    return [
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate.model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": candidate.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: prompt.system }] },
          contents: prompt.messages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: prompt.temperature ?? 0.2,
            maxOutputTokens,
            ...(prompt.jsonSchema ? { responseMimeType: "application/json", responseSchema: prompt.jsonSchema } : {}),
          },
        }),
      },
    ];
  }

  if (candidate.provider === "ANTHROPIC") {
    return [
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": candidate.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: candidate.model,
          max_tokens: maxOutputTokens,
          system: prompt.system,
          messages: prompt.messages,
          temperature: prompt.temperature ?? 0.2,
          ...(prompt.jsonSchema ? { output_config: { format: { type: "json_schema", schema: prompt.jsonSchema } } } : {}),
        }),
      },
    ];
  }

  return [
    candidate.provider === "OPENAI" ? "https://api.openai.com/v1/responses" : "https://api.x.ai/v1/responses",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${candidate.apiKey}` },
      body: JSON.stringify({
        model: candidate.model,
        instructions: prompt.system,
        input: prompt.messages,
        max_output_tokens: maxOutputTokens,
        temperature: prompt.temperature ?? 0.2,
        ...(prompt.jsonSchema ? { text: { format: { type: "json_schema", name: "portfolio_response", strict: true, schema: prompt.jsonSchema } } } : {}),
      }),
    },
  ];
}

function responseText(provider: AiProvider, payload: Record<string, unknown>) {
  if (provider === "GEMINI") {
    const candidates = payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  }
  if (provider === "ANTHROPIC") {
    const content = payload.content as Array<{ type?: string; text?: string }> | undefined;
    return content?.filter((part) => part.type === "text").map((part) => part.text ?? "").join("").trim();
  }
  if (typeof payload.output_text === "string") return payload.output_text.trim();
  const output = payload.output as Array<{ content?: Array<{ type?: string; text?: string }> }> | undefined;
  return output?.flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text").map((part) => part.text ?? "").join("").trim();
}

async function callProvider(candidate: ProviderCandidate, prompt: ProviderPrompt, fetcher: Fetcher) {
  const [url, init] = requestFor(candidate, prompt);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(1_000, Math.min(prompt.timeoutMs ?? 20_000, 120_000)));
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const retryable = ![400, 422].includes(response.status);
      throw new ProviderCallError(
        retryable ? `Provider unavailable (${response.status}).` : `Provider rejected the request (${response.status}).`,
        retryable,
      );
    }
    const payload = await response.json() as Record<string, unknown>;
    if (candidate.provider === "GEMINI") {
      const finishReason = (payload.candidates as Array<{ finishReason?: string }> | undefined)?.[0]?.finishReason;
      if (finishReason === "SAFETY") throw new ProviderCallError("Provider refused the request.", false, "refusal");
      if (finishReason && finishReason !== "STOP") throw new ProviderCallError("Provider returned an incomplete response.", true, "incomplete-response");
    }
    const text = responseText(candidate.provider, payload);
    if (!text) throw new ProviderCallError("Provider returned an empty response.", true, "empty-response");
    return text;
  } catch (error) {
    if (error instanceof ProviderCallError) throw error;
    throw new ProviderCallError(
      error instanceof Error && error.name === "AbortError" ? "Provider timed out." : "Provider request failed.",
      true,
      error instanceof Error && error.name === "AbortError" ? "timeout" : "provider-error",
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function runProviderCandidates(
  candidates: ProviderCandidate[],
  prompt: ProviderPrompt,
  fetcher: Fetcher = fetch,
  quotaConsumer: QuotaConsumer = consumeProviderQuota,
): Promise<ProviderResult> {
  if (!candidates.length) throw new ProviderCallError("No AI provider is configured.", true, "missing-api-key");
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      if (prompt.enforceQuota && !(await quotaConsumer(candidate.provider, candidate.dailyRequestLimit ?? 100))) {
        lastError = new ProviderCallError(`${candidate.provider} daily request limit reached.`, true, "rate-limit");
        continue;
      }
      return { text: await callProvider(candidate, prompt, fetcher), provider: candidate.provider, model: candidate.model };
    } catch (error) {
      lastError = error;
      if (error instanceof ProviderCallError && !error.retryable) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new ProviderCallError("All AI providers failed.", true);
}

export async function loadProviderCandidates(): Promise<ProviderCandidate[]> {
  const candidates: ProviderCandidate[] = [];
  if (process.env.DATABASE_URL && process.env.AI_KEYS_ENCRYPTION_KEY) {
    try {
      const { prisma } = await import("@/lib/prisma");
      const providers = await prisma.aiProviderConfig.findMany({
        where: { enabled: true },
        orderBy: { priority: "asc" },
        include: { keys: { where: { enabled: true }, orderBy: { priority: "asc" } } },
      });
      for (const provider of providers) {
        if (!provider.selectedModel) continue;
        for (const key of provider.keys) {
          candidates.push({
            provider: provider.provider,
            model: provider.selectedModel,
            apiKey: decryptApiKey(key),
            maxOutputTokens: provider.maxOutputTokens,
            dailyRequestLimit: provider.dailyRequestLimit,
          });
        }
      }
    } catch {
      // Database configuration is optional while bootstrapping from an environment key.
    }
  }

  if (!candidates.length && process.env.GEMINI_API_KEY) {
    candidates.push({
      provider: "GEMINI",
      model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
      apiKey: process.env.GEMINI_API_KEY,
      maxOutputTokens: 1200,
      dailyRequestLimit: Number(process.env.AI_DAILY_REQUEST_LIMIT ?? 100),
    });
  }
  return candidates;
}

export async function runTextWithFallback(prompt: ProviderPrompt) {
  return runProviderCandidates(await loadProviderCandidates(), prompt);
}

export async function runJsonWithFallback<T>(
  prompt: ProviderPrompt,
  schema: { parse(value: unknown): T },
) {
  const result = await runTextWithFallback(prompt);
  const jsonText = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return { ...result, value: schema.parse(JSON.parse(jsonText)) };
}
