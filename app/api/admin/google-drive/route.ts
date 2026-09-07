import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { getDriveConnection, googleDriveConfigured, verifyDriveConnection } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function denied() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

async function state() {
  const [connection, legacy, drive] = await Promise.all([getDriveConnection(), prisma.storedFile.aggregate({ _count: true, _sum: { size: true } }), prisma.mediaAsset.aggregate({ _count: true, _sum: { size: true } })]);
  return { configured: googleDriveConfigured(), connected: Boolean(connection), accountEmail: connection?.accountEmail ?? null, lastVerifiedAt: connection?.lastVerifiedAt?.toISOString() ?? null, legacy: { count: legacy._count, size: legacy._sum.size ?? 0 }, drive: { count: drive._count, size: drive._sum.size ?? 0 } };
}

export async function GET() {
  const error = await denied(); if (error) return error;
  try { return NextResponse.json(await state()); }
  catch { return NextResponse.json({ error: "Google Drive storage needs its database setup before it can be connected." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const error = await denied(); if (error) return error;
  const body = await request.json().catch(() => null);
  if (body?.action !== "verify") return NextResponse.json({ error: "Unsupported Drive action." }, { status: 400 });
  try { await verifyDriveConnection(); return NextResponse.json(await state()); }
  catch { return NextResponse.json({ error: "Google Drive could not be verified. Reconnect the account and try again." }, { status: 502 }); }
}
