import { NextResponse } from "next/server";
import { getJobFitInquiry } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = jobFitSessionFrom(request);
  if (!sessionId) return NextResponse.json({ error: "This Job Fit session is unavailable in this browser." }, { status: 404 });
  const inquiry = await getJobFitInquiry(id, sessionId);
  if (!inquiry) return NextResponse.json({ error: "Job Fit inquiry not found or expired." }, { status: 404 });
  return NextResponse.json({ inquiry: { id: inquiry.id, company: inquiry.company, role: inquiry.role, location: inquiry.location, status: inquiry.status, coreResult: inquiry.coreResult, researchResult: inquiry.researchResult, createdAt: inquiry.createdAt, briefAvailable: Boolean(inquiry.coreResult), sourceAvailable: Boolean(inquiry.sourceAsset || inquiry.sourceEncryptedValue), events: inquiry.events, chats: inquiry.chats } });
}
