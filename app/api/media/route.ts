import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMimeTypeByExtension,
  IMAGE_TYPES,
  MAX_DATABASE_FILE_SIZE,
  requestIsTooLarge,
  safeFileName,
  storedFileUrl,
} from "@/lib/stored-files";

export const runtime = "nodejs";

function errorResponse(error: string, status: number, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
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
      return errorResponse("Image exceeds 4 MB limit.", 413);
    }

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return errorResponse("No image provided.", 400);
    }
    if (!file.size) {
      return errorResponse("The uploaded image is empty.", 400);
    }
    if (file.size > MAX_DATABASE_FILE_SIZE) {
      return errorResponse("Image exceeds 4 MB limit.", 413);
    }
    let fileType = file.type;
    if (!IMAGE_TYPES.has(fileType)) {
      const fallbackMime = getMimeTypeByExtension(file.name);
      if (fallbackMime && IMAGE_TYPES.has(fallbackMime)) {
        fileType = fallbackMime;
      } else {
        return errorResponse(
          "Unsupported image type. Upload JPEG, PNG, GIF, or WebP.",
          415,
        );
      }
    }

    const stored = await prisma.storedFile.create({
      data: {
        fileName: safeFileName(file.name, "portfolio-image"),
        contentType: fileType,
        size: file.size,
        data: Buffer.from(await file.arrayBuffer()),
      },
      select: { id: true },
    });

    return NextResponse.json({ url: storedFileUrl(stored.id) }, { status: 201 });
  } catch (error) {
    console.error(`[media:${requestId}] Database upload failed`, error);
    return NextResponse.json(
      {
        error: "Failed to upload image.",
        message: "The image could not be stored in the database.",
        requestId,
      },
      { status: 500 },
    );
  }
}
