import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

function errorResponse(error: string, status: number, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

async function uploadToCloudinary(file: File) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    throw new Error(
      "Cloudinary upload credentials are not configured. Set CLOUDINARY_CLOUD_NAME and either CLOUDINARY_UPLOAD_PRESET or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.",
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("folder", "portfolio");

  if (uploadPreset) {
    body.append("upload_preset", uploadPreset);
  } else {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash("sha1")
      .update(`folder=portfolio&timestamp=${timestamp}${apiSecret}`)
      .digest("hex");
    body.append("api_key", apiKey!);
    body.append("timestamp", timestamp);
    body.append("signature", signature);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    { method: "POST", body },
  );
  const payload = (await response.json().catch(() => null)) as
    | { secure_url?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message ?? `Cloudinary returned HTTP ${response.status}.`);
  }

  return payload.secure_url;
}

async function uploadLocally(file: File, extension: string) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    Buffer.from(await file.arrayBuffer()),
  );
  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return errorResponse("Unauthorized", 401);
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_SIZE + 128 * 1024) {
      return errorResponse("File exceeds 4 MB limit.", 413);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("Invalid multipart form data.", 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("No file provided.", 400);
    }
    if (file.size === 0) {
      return errorResponse("The uploaded file is empty.", 400);
    }
    if (file.size > MAX_SIZE) {
      return errorResponse("File exceeds 4 MB limit.", 413);
    }

    const extension = ALLOWED_TYPES[file.type];
    if (!extension) {
      return errorResponse(
        "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, SVG.",
        415,
      );
    }

    const url =
      process.env.NODE_ENV === "production"
        ? await uploadToCloudinary(file)
        : await uploadLocally(file, extension);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error.";
    console.error("Media upload failed:", error);
    return errorResponse("Failed to upload media.", 500, message);
  }
}
