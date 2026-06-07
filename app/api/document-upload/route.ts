import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DOCUMENT_DIR = path.join(process.cwd(), "public", "documents");
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
};

function safeBaseName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No document provided." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Document exceeds 10 MB limit." }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Unsupported document type. Upload PDF, DOC, or DOCX." }, { status: 400 });
  }

  await mkdir(DOCUMENT_DIR, { recursive: true });
  const name = safeBaseName(file.name) || "portfolio-document";
  const filename = `${Date.now()}-${name}-${randomUUID().slice(0, 8)}${ext}`;
  const filepath = path.join(DOCUMENT_DIR, filename);
  await writeFile(filepath, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/documents/${filename}` }, { status: 201 });
}
