import assert from "node:assert/strict";
import test from "node:test";
import { discoverModels, runProviderCandidates, type ProviderCandidate } from "./ai-providers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("normalizes official model discovery responses", async () => {
  const fixtures = {
    GEMINI: {
      body: { models: [{ name: "models/gemini-text", supportedGenerationMethods: ["generateContent"] }, { name: "models/embed", supportedGenerationMethods: ["embedContent"] }] },
      want: ["gemini-text"],
    },
    OPENAI: { body: { data: [{ id: "gpt-small" }, { id: "text-embedding-3-small" }] }, want: ["gpt-small"] },
    ANTHROPIC: { body: { data: [{ id: "claude-haiku", display_name: "Claude Haiku" }] }, want: ["claude-haiku"] },
    XAI: { body: { models: [{ id: "grok-fast" }] }, want: ["grok-fast"] },
  } as const;

  for (const [provider, fixture] of Object.entries(fixtures)) {
    const models = await discoverModels(provider as keyof typeof fixtures, "test-key", async () => json(fixture.body));
    assert.deepEqual(models.map((model) => model.id), fixture.want);
  }
});

test("uses a Gemini-compatible JSON Schema without excessive constraints", async () => {
  let requestBody = "";
  await runProviderCandidates(
    [{ provider: "GEMINI", model: "gemini", apiKey: "key", maxOutputTokens: 100 }],
    {
      system: "System",
      messages: [{ role: "user", content: "Question" }],
      jsonSchema: { type: "object", properties: { value: { type: "object", additionalProperties: false } }, additionalProperties: false },
    },
    async (_url, init) => {
      requestBody = String(init?.body ?? "");
      return json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] });
    },
  );

  const generationConfig = JSON.parse(requestBody).generationConfig;
  assert.equal(generationConfig.responseSchema, undefined);
  assert.equal(generationConfig.responseJsonSchema.additionalProperties, false);
  assert.doesNotMatch(JSON.stringify(generationConfig.responseJsonSchema), /"pattern"|"minItems"|"maxItems"|"minimum"|"maximum"/);
});

test("moves to the next ordered candidate after a retryable provider failure", async () => {
  const candidates: ProviderCandidate[] = [
    { provider: "GEMINI", model: "first", apiKey: "first-key", maxOutputTokens: 100 },
    { provider: "GEMINI", model: "second", apiKey: "second-key", maxOutputTokens: 100 },
  ];
  let calls = 0;
  const result = await runProviderCandidates(
    candidates,
    { system: "Stay grounded.", messages: [{ role: "user", content: "Hello" }] },
    async () => {
      calls += 1;
      return calls === 1
        ? json({ error: { message: "quota" } }, 429)
        : json({ candidates: [{ content: { parts: [{ text: "Grounded answer" }] } }] });
    },
  );

  assert.equal(calls, 2);
  assert.deepEqual(result, { text: "Grounded answer", provider: "GEMINI", model: "second" });
});

test("shares one timeout budget across all provider candidates", async () => {
  const candidates: ProviderCandidate[] = [
    { provider: "GEMINI", model: "first", apiKey: "first-key", maxOutputTokens: 100 },
    { provider: "OPENAI", model: "second", apiKey: "second-key", maxOutputTokens: 100 },
  ];
  let calls = 0;
  const startedAt = Date.now();

  await assert.rejects(
    runProviderCandidates(candidates, { system: "System", messages: [{ role: "user", content: "Question" }], timeoutMs: 40 }, async (_url, init) => {
      calls += 1;
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }),
    (error: unknown) => error instanceof Error && "reason" in error && error.reason === "timeout",
  );

  assert.equal(calls, 1);
  assert.ok(Date.now() - startedAt < 500);
});

test("does not retry a malformed provider request", async () => {
  const candidates: ProviderCandidate[] = [
    { provider: "OPENAI", model: "bad", apiKey: "first-key", maxOutputTokens: 100 },
    { provider: "OPENAI", model: "unused", apiKey: "second-key", maxOutputTokens: 100 },
  ];
  let calls = 0;
  await assert.rejects(
    runProviderCandidates(candidates, { system: "System", messages: [{ role: "user", content: "Hi" }] }, async () => {
      calls += 1;
      return json({ error: { message: "bad request" } }, 400);
    }),
    /rejected the request/i,
  );
  assert.equal(calls, 1);
});

test("classifies rejected credentials so Job Fit may use its no-key fallback", async () => {
  await assert.rejects(
    runProviderCandidates(
      [{ provider: "GEMINI", model: "gemini", apiKey: "bad-key", maxOutputTokens: 100 }],
      { system: "System", messages: [{ role: "user", content: "Hi" }] },
      async () => json({ error: { message: "unauthorized" } }, 401),
    ),
    (error: unknown) => error instanceof Error && "reason" in error && error.reason === "missing-api-key",
  );
});

test("parses OpenAI, Anthropic, and xAI text response shapes", async () => {
  const cases = [
    { provider: "OPENAI" as const, body: { output: [{ content: [{ type: "output_text", text: "OpenAI answer" }] }] }, want: "OpenAI answer" },
    { provider: "ANTHROPIC" as const, body: { content: [{ type: "text", text: "Claude answer" }] }, want: "Claude answer" },
    { provider: "XAI" as const, body: { output: [{ content: [{ type: "output_text", text: "Grok answer" }] }] }, want: "Grok answer" },
  ];
  for (const item of cases) {
    const result = await runProviderCandidates(
      [{ provider: item.provider, model: "model", apiKey: "key", maxOutputTokens: 100 }],
      { system: "System", messages: [{ role: "user", content: "Question" }] },
      async () => json(item.body),
    );
    assert.equal(result.text, item.want);
  }
});

test("skips a provider whose daily cost cap is exhausted", async () => {
  const candidates: ProviderCandidate[] = [
    { provider: "GEMINI", model: "gemini", apiKey: "key-1", maxOutputTokens: 100, dailyRequestLimit: 10 },
    { provider: "OPENAI", model: "openai", apiKey: "key-2", maxOutputTokens: 100, dailyRequestLimit: 20 },
  ];
  const called: string[] = [];
  const result = await runProviderCandidates(
    candidates,
    { system: "System", messages: [{ role: "user", content: "Question" }], enforceQuota: true },
    async (url) => {
      called.push(String(url));
      return json({ output_text: "Fallback provider answer" });
    },
    async (provider, limit) => provider === "OPENAI" && limit === 20,
  );

  assert.equal(called.length, 1);
  assert.match(called[0], /openai/);
  assert.equal(result.provider, "OPENAI");
});
