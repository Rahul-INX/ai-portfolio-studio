import { NextResponse } from "next/server";
import { buildRequirementAlignment, deterministicJobFit, selectRelevantJobEvidence } from "@/lib/job-fit";
import { getJobFitSettings } from "@/lib/job-fit-settings";
import { runResumeMatchAgent } from "@/lib/resume-match-agent";
import { evidenceBlock, gatherAllPortfolioEvidence } from "@/lib/site-context";
import { getSiteProfile } from "@/lib/content";

export const runtime = "nodejs";

const maxJdChars = 18_000;
const maxFileBytes = 4 * 1024 * 1024;

const allowedFileTypes = new Map([
  [".txt", "text/plain"],
  [".pdf", "application/pdf"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
]);

function extensionOf(filename: string) {
  const match = filename.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? "";
}

function normalizeText(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

async function textFromFile(file: File) {
  if (file.size > maxFileBytes) {
    throw new Error("JD file is too large. Attach a file up to 4 MB.");
  }

  const ext = extensionOf(file.name);
  if (!allowedFileTypes.has(ext)) {
    throw new Error("Attach a .txt, .pdf, or .docx job description file.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (ext === ".txt") {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes });
    try {
      const parsed = await parser.getText();
      return parsed.text ?? "";
    } finally {
      await parser.destroy();
    }
  }

  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer: bytes });
  return parsed.value;
}

function responseError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return responseError("Send the job description as form data.");
  }

  const rawText = typeof formData.get("jdText") === "string" ? String(formData.get("jdText")) : "";
  const file = formData.get("jdFile");
  let fileText = "";

  try {
    if (file instanceof File && file.size > 0) {
      fileText = await textFromFile(file);
    }
  } catch (error) {
    return responseError(error instanceof Error ? error.message : "Could not read the attached JD file.");
  }

  const jdText = normalizeText([rawText, fileText].filter(Boolean).join("\n\n"));
  if (jdText.length < 80) {
    return responseError("Add a fuller job description with responsibilities, skills, or requirements.");
  }
  if (jdText.length > maxJdChars) {
    return responseError(`Keep the job description under ${maxJdChars.toLocaleString()} characters.`);
  }

  const [siteEvidence, settings, profile] = await Promise.all([
    gatherAllPortfolioEvidence(jdText),
    getJobFitSettings(),
    getSiteProfile()
  ]);
  const evidence = selectRelevantJobEvidence(jdText, siteEvidence);
  const alignmentNotes = buildRequirementAlignment(jdText, siteEvidence);
  const fallback = deterministicJobFit(jdText, evidence, siteEvidence);
  if (!evidence.length) {
    return NextResponse.json({ result: fallback });
  }

  const agentRun = await runResumeMatchAgent({
    ownerName: profile.name,
    jdText,
    evidence,
    evidenceText: evidenceBlock(evidence),
    timeoutMs: settings.fallbackTimeoutSeconds * 1_000
  });

  if (agentRun.ok) {
    return NextResponse.json({ result: { ...agentRun.result, alignmentNotes } });
  }

  console.warn("[resume-match-agent] Run failed.", {
    reason: agentRun.reason,
    detail: agentRun.detail
  });

  if (settings.deterministicFallbackEnabled) {
    return NextResponse.json({
      result: fallback,
      fallbackReason: agentRun.reason
    });
  }

  const message =
    agentRun.reason === "timeout"
      ? `The Resume Match Specialist exceeded the ${settings.fallbackTimeoutSeconds}-second timeout.`
      : `The Resume Match Specialist could not return a grounded result (${agentRun.reason}).`;

  return responseError(`${message} Deterministic fallback is disabled.`, 503);
}
