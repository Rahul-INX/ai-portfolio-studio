import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions, isAdminSession } from "@/lib/auth";
import { driveFolders, finalizeDriveUpload } from "@/lib/google-drive";

export const runtime = "nodejs";
const schema = z.object({ externalId: z.string().min(1).max(200), folder: z.enum(driveFolders), size: z.number().int().positive().max(100 * 1024 * 1024) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "The uploaded Drive file could not be verified." }, { status: 400 });
  try { const result = await finalizeDriveUpload(parsed.data); return NextResponse.json({ url: result.url, size: result.asset.size }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "The Drive upload could not be finalized." }, { status: 502 }); }
}
