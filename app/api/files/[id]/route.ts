import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const file = await prisma.storedFile.findUnique({
      where: { id },
      select: {
        data: true,
        fileName: true,
        contentType: true,
        size: true,
        createdAt: true,
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const disposition = file.contentType.startsWith("image/") ? "inline" : "attachment";
    const fileName = encodeURIComponent(file.fileName);

    return new Response(file.data, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.size),
        "Content-Disposition": `${disposition}; filename*=UTF-8''${fileName}`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Last-Modified": file.createdAt.toUTCString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Database file read failed", error);
    return NextResponse.json(
      { error: "The requested file is temporarily unavailable." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const url = `/api/files/${encodeURIComponent(id)}`;
  const references = await Promise.all([
    prisma.project.count({ where: { imageUrl: url } }),
    prisma.caseStudy.count({ where: { imageUrl: url } }),
    prisma.experiment.count({ where: { imageUrl: url } }),
    prisma.blog.count({ where: { imageUrl: url } }),
    prisma.dashboard.count({ where: { imageUrl: url } }),
    prisma.achievement.count({ where: { imageUrl: url } }),
    prisma.portfolioDocument.count({ where: { fileUrl: url } }),
    prisma.siteProfile.count({ where: { profileImageUrl: url } }),
  ]);
  if (references.some(Boolean)) {
    return NextResponse.json({ error: "Remove this file from its content record before deleting it." }, { status: 409 });
  }

  try {
    await prisma.storedFile.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
