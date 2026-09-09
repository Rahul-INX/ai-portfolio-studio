import { NextResponse } from "next/server";
import { getJobFitInquiry } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";
import { renderJobFitRecruiterBrief } from "@/lib/job-fit-brief";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inquiry = await getJobFitInquiry(id, jobFitSessionFrom(request));
  if (!inquiry?.coreResult) return NextResponse.json({ error: "Recruiter brief not found." }, { status: 404 });
  const result = inquiry.coreResult as unknown as JobFitIntelligenceResult;
  const role = result.metadata.role?.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase() || "role";
  return new Response(renderJobFitRecruiterBrief(result), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="job-fit-${role}-brief.md"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
