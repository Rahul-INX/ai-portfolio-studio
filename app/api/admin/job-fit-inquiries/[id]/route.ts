import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { getAdminJobFitInquiry, setJobFitPublicApproval } from "@/lib/job-fit-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params; const inquiry = await getAdminJobFitInquiry(id);
  return inquiry ? NextResponse.json({ inquiry }) : NextResponse.json({ error: "Inquiry not found, expired, or unavailable." }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { publicApproved?: unknown } | null;
  if (typeof body?.publicApproved !== "boolean") return NextResponse.json({ error: "publicApproved must be a boolean." }, { status: 400 });
  const { id } = await params; const inquiry = await setJobFitPublicApproval(id, body.publicApproved);
  return inquiry ? NextResponse.json({ inquiry }) : NextResponse.json({ error: "Inquiry could not be updated." }, { status: 404 });
}
