import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { listAdminJobFitInquiries } from "@/lib/job-fit-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data = await listAdminJobFitInquiries();
  return data ? NextResponse.json(data) : NextResponse.json({ error: "Apply the Job Fit database schema to review inquiries." }, { status: 503 });
}
