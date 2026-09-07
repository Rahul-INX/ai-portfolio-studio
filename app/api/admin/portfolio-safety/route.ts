import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminSession } from "@/lib/auth";
import { portfolioReviewKinds, reviewPortfolioSource, type PortfolioReviewKind } from "@/lib/portfolio-safety";

export const runtime = "nodejs";

const maxFileBytes = 4 * 1024 * 1024;
const maxSourceChars = 18_000;
const allowedExtensions = new Set([".txt", ".pdf", ".docx"]);

function extensionOf(filename: string) {
  return filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
}

function normalizeText(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

async function textFromFile(file: File) {
  if (file.size > maxFileBytes) throw new Error("Source file is too large. Use a file up to 4 MB.");
  const extension = extensionOf(file.name);
  if (!allowedExtensions.has(extension)) throw new Error("Attach a .txt, .pdf, or .docx file. For older .doc files, save as DOCX or paste the text.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (extension === ".txt") return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (extension === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes });
    try {
      return (await parser.getText()).text ?? "";
    } finally {
      await parser.destroy();
    }
  }
  const mammoth = await import("mammoth");
  return (await mammoth.extractRawText({ buffer: bytes })).value;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "");
    if (!portfolioReviewKinds.includes(kind as PortfolioReviewKind)) {
      return NextResponse.json({ error: "Choose a portfolio content type before reviewing." }, { status: 400 });
    }
    const sourceText = typeof formData.get("sourceText") === "string" ? String(formData.get("sourceText")) : "";
    const file = formData.get("sourceFile");
    const fileText = file instanceof File && file.size ? await textFromFile(file) : "";
    const source = normalizeText([sourceText, fileText].filter(Boolean).join("\n\n"));
    if (source.length < 80) return NextResponse.json({ error: "Paste or attach at least 80 characters of source material." }, { status: 400 });
    if (source.length > maxSourceChars) return NextResponse.json({ error: `Keep source material under ${maxSourceChars.toLocaleString()} characters.` }, { status: 413 });
    const restrictedTerms = String(formData.get("restrictedTerms") ?? "").split(",").map((term) => term.trim()).filter(Boolean).slice(0, 20);
    const result = await reviewPortfolioSource({ source, kind: kind as PortfolioReviewKind, restrictedTerms });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The publish-safety review could not be completed.";
    const isSourceError = message.startsWith("Source file is") || message.startsWith("Attach a .txt");
    return NextResponse.json({ error: message }, { status: isSourceError ? 400 : 502 });
  }
}
