import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DOCUMENT_TYPES,
  getMimeTypeByExtension,
  MAX_DATABASE_FILE_SIZE,
  requestIsTooLarge,
  safeFileName,
  storedFileUrl,
} from "@/lib/stored-files";

export const runtime = "nodejs";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }
    if (!process.env.DATABASE_URL) {
      return errorResponse("DATABASE_URL is required for uploads.", 503);
    }
    if (requestIsTooLarge(request)) {
      return errorResponse("Document exceeds 4 MB limit.", 413);
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return errorResponse("No document provided.", 400);
    }
    if (!file.size) {
      return errorResponse("The uploaded document is empty.", 400);
    }
    if (file.size > MAX_DATABASE_FILE_SIZE) {
      return errorResponse("Document exceeds 4 MB limit.", 413);
    }
    let fileType = file.type;
    if (!DOCUMENT_TYPES.has(fileType)) {
      const fallbackMime = getMimeTypeByExtension(file.name);
      if (fallbackMime && DOCUMENT_TYPES.has(fallbackMime)) {
        fileType = fallbackMime;
      } else {
        return errorResponse(
          "Unsupported document type. Upload PDF, DOC, or DOCX.",
          415,
        );
      }
    }

    const stored = await prisma.storedFile.create({
      data: {
        fileName: safeFileName(file.name, "portfolio-document"),
        contentType: fileType,
        size: file.size,
        data: Buffer.from(await file.arrayBuffer()),
      },
      select: { id: true },
    });

    return NextResponse.json({ url: storedFileUrl(stored.id) }, { status: 201 });
  } catch (error) {
    console.error(`[document:${requestId}] Database upload failed`, error);
    return NextResponse.json(
      {
        error: "Failed to upload document.",
        message: "The document could not be stored in the database.",
        requestId,
      },
      { status: 500 },
    );
  }
}
