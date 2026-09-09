import { NextResponse } from "next/server";
import { z } from "zod";
import { loadProviderCandidates, streamProviderCandidates } from "@/lib/ai-providers";
import { jobFitChatSystem } from "@/lib/job-fit-chat";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import { appendJobFitChatMessage, getJobFitInquiry } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

const bodySchema = z.object({ message: z.string().trim().min(1).max(1_500) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Ask a focused Job Fit question." }, { status: 400 });
  const sessionId = jobFitSessionFrom(request); const inquiry = sessionId ? await getJobFitInquiry(id, sessionId) : null;
  if (!inquiry?.coreResult) return NextResponse.json({ error: "This Job Fit inquiry is unavailable or has expired." }, { status: 404 });
  const result = inquiry.coreResult as unknown as JobFitIntelligenceResult;
  await appendJobFitChatMessage(inquiry.id, "user", parsed.data.message);
  const messages: Array<{ role: "user" | "assistant"; content: string }> = inquiry.chats.slice(-10).flatMap((message) => message.role === "user" || message.role === "assistant" ? [{ role: message.role as "user" | "assistant", content: message.content }] : []);
  messages.push({ role: "user", content: parsed.data.message });
  try {
    const provider = await streamProviderCandidates(await loadProviderCandidates(), { system: jobFitChatSystem(result), messages, temperature: 0.2, timeoutMs: 30_000, enforceQuota: true });
    const decoder = new TextDecoder(); const encoder = new TextEncoder(); let answer = "";
    const persistence = new TransformStream<Uint8Array, Uint8Array>({ transform(chunk, controller) { answer += decoder.decode(chunk, { stream: true }); controller.enqueue(chunk); }, async flush(controller) { answer += decoder.decode(); if (!answer.trim()) { answer = "The configured AI provider did not finish this response. Please try again."; controller.enqueue(encoder.encode(answer)); } await appendJobFitChatMessage(inquiry.id, "assistant", answer.trim()); } });
    return new Response(provider.stream.pipeThrough(persistence), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "X-Job-Fit-Provider": provider.provider.toLowerCase() } });
  } catch {
    return NextResponse.json({ error: "A streaming AI provider is not available for this Job Fit inquiry." }, { status: 503 });
  }
}
