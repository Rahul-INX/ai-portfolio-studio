import assert from "node:assert/strict";
import test from "node:test";
import { streamProviderCandidates, type ProviderCandidate } from "@/lib/ai-providers";

async function textFrom(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader(); const decoder = new TextDecoder(); let value = "";
  while (true) { const next = await reader.read(); if (next.done) return value; value += decoder.decode(next.value, { stream: true }); }
}

test("streams Gemini SSE text deltas without replaying a completed response", async () => {
  const candidates: ProviderCandidate[] = [{ provider: "GEMINI", model: "gemini-test", apiKey: "key", maxOutputTokens: 100 }];
  const response = new Response("data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Hello \"}]}}]}\n\ndata: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"world\"}]}}]}\n\n", { status: 200 });
  const result = await streamProviderCandidates(candidates, { system: "Be concise.", messages: [{ role: "user", content: "Hi" }] }, async () => response, async () => true);
  assert.equal(await textFrom(result.stream), "Hello world");
});

test("parses Gemini CRLF-framed SSE responses", async () => {
  const candidates: ProviderCandidate[] = [{ provider: "GEMINI", model: "gemini-test", apiKey: "key", maxOutputTokens: 100 }];
  const bytes = new TextEncoder().encode("data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"OK\"}]},\"finishReason\":\"STOP\"}]}\r\n\r\n");
  const response = new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); } }), { status: 200 });
  const result = await streamProviderCandidates(candidates, { system: "Be concise.", messages: [{ role: "user", content: "Hi" }] }, async () => response, async () => true);
  assert.equal(await Promise.race([textFrom(result.stream), new Promise((_, reject) => setTimeout(() => reject(new Error("terminal frame did not close")), 80))]), "OK");
});

test("ends a provider stream that never closes", async () => {
  const candidates: ProviderCandidate[] = [{ provider: "GEMINI", model: "gemini-test", apiKey: "key", maxOutputTokens: 100 }];
  const response = new Response(new ReadableStream<Uint8Array>({ pull() {} }), { status: 200 });
  const result = await streamProviderCandidates(candidates, { system: "Be concise.", messages: [{ role: "user", content: "Hi" }], timeoutMs: 20 }, async () => response, async () => true);
  assert.equal(
    await Promise.race([textFrom(result.stream), new Promise((_, reject) => setTimeout(() => reject(new Error("stream did not time out")), 80))]),
    "",
  );
});

test("times out before a provider starts its stream", async () => {
  const candidates: ProviderCandidate[] = [{ provider: "GEMINI", model: "gemini-test", apiKey: "key", maxOutputTokens: 100 }];
  await assert.rejects(
    Promise.race([streamProviderCandidates(candidates, { system: "Be concise.", messages: [{ role: "user", content: "Hi" }], timeoutMs: 20 }, async () => new Promise<Response>(() => {}), async () => true), new Promise((_, reject) => setTimeout(() => reject(new Error("provider request did not time out")), 1_200))]),
    /Provider request timed out/,
  );
});
