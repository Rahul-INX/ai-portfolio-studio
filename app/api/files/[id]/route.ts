import { NextResponse } from "next/server";
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
