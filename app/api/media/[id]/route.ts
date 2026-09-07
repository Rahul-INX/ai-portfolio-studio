import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAdminSession } from "@/lib/auth";
import { downloadDriveAsset, trashDriveAsset } from "@/lib/google-drive";
import { mediaReferences } from "@/lib/media-references";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.trashedAt) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  const url = `/api/media/${encodeURIComponent(id)}`;
  const session = await getServerSession(authOptions);
  const references = await mediaReferences(url);
  if (!references.public && !isAdminSession(session)) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  try {
    const file = await downloadDriveAsset(asset.externalId);
    return new Response(file.body, { headers: { "Content-Type": asset.contentType, "Content-Length": String(asset.size), "Content-Disposition": asset.contentType.startsWith("image/") ? "inline" : `attachment; filename*=UTF-8''${encodeURIComponent(asset.fileName)}`, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return NextResponse.json({ error: "Media is temporarily unavailable." }, { status: 503 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.trashedAt) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  if ((await mediaReferences(`/api/media/${encodeURIComponent(id)}`)).total) return NextResponse.json({ error: "Remove this media from its content record before deleting it." }, { status: 409 });
  try { await trashDriveAsset(asset.externalId); await prisma.mediaAsset.update({ where: { id }, data: { trashedAt: new Date() } }); return NextResponse.json({ deleted: true }); }
  catch { return NextResponse.json({ error: "Google Drive could not remove this media." }, { status: 502 }); }
}
