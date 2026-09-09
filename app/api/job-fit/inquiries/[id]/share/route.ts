import { NextResponse } from "next/server";
import { createJobFitShareLink } from "@/lib/job-fit-store";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const share = await createJobFitShareLink(id, jobFitSessionFrom(request));
  if (!share) return NextResponse.json({ error: "This inquiry cannot be shared. Save it securely first." }, { status: 409 });
  return NextResponse.json({ url: `/job-fit/share/${share.token}`, expiresAt: share.expiresAt });
}
