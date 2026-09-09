import { NextResponse } from "next/server";
import { getJobFitInquiry } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sessionId = jobFitSessionFrom(request);
  const inquiry = sessionId ? await getJobFitInquiry(id, sessionId) : null;
  if (!inquiry) return NextResponse.json({ error: "Job Fit inquiry not found or expired." }, { status: 404 });
  const after = request.headers.get("last-event-id") ?? new URL(request.url).searchParams.get("after");
  const events = inquiry.events.filter((event) => !after || event.id > after);
  const encoder = new TextEncoder();
  return new Response(new ReadableStream({ start(controller) { for (const event of events) controller.enqueue(encoder.encode(`id: ${event.id}\nevent: stage\ndata: ${JSON.stringify({ id: event.id, stage: event.stage, status: event.status, detail: event.detail, createdAt: event.createdAt })}\n\n`)); controller.close(); } }), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}
