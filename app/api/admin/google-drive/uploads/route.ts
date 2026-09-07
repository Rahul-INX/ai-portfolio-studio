import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions, isAdminSession } from "@/lib/auth";
import { driveFolders, initiateDriveUpload } from "@/lib/google-drive";
import { DOCUMENT_TYPES, IMAGE_TYPES, getMimeTypeByExtension } from "@/lib/stored-files";

export const runtime = "nodejs";
const maxDriveUploadBytes = 100 * 1024 * 1024;
const schema = z.object({ fileName: z.string().min(1).max(160), contentType: z.string().min(1).max(120), size: z.number().int().positive().max(maxDriveUploadBytes), folder: z.enum(driveFolders) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Choose a supported file smaller than 100 MB." }, { status: 400 });
  const contentType = IMAGE_TYPES.has(parsed.data.contentType) || DOCUMENT_TYPES.has(parsed.data.contentType) ? parsed.data.contentType : getMimeTypeByExtension(parsed.data.fileName);
  if (!contentType || (!IMAGE_TYPES.has(contentType) && !DOCUMENT_TYPES.has(contentType))) return NextResponse.json({ error: "Supported files are JPEG, PNG, GIF, WebP, PDF, DOC, and DOCX." }, { status: 415 });
  try {
    const upload = await initiateDriveUpload({ ...parsed.data, contentType, origin: request.headers.get("origin") ?? undefined });
    return NextResponse.json(upload ? { mode: "drive", ...upload } : { mode: "database" });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Google Drive upload could not start." }, { status: 502 }); }
}
