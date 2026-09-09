import { NextResponse } from "next/server";
import { deterministicJobFit } from "@/lib/job-fit";
import { getJobFitSettings } from "@/lib/job-fit-settings";
import { buildJobFitIntelligenceResult, withFinalJobFitAudit } from "@/lib/job-fit-intelligence";
import { runJobFitResearch } from "@/lib/job-fit-research-workflow";
import { persistJobFitInquiry } from "@/lib/job-fit-store";
import { runResumeMatchAgent, shouldUseDeterministicFallback } from "@/lib/resume-match-agent";
import { evidenceBlock, gatherAllPortfolioEvidence } from "@/lib/site-context";
import { getSiteProfile } from "@/lib/content";
import { start } from "workflow/api";
import { jobFitSessionFrom } from "@/lib/job-fit-session";

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
  return value
    .replace(/\u0000/g, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
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

  const contentType = allowedFileTypes.get(ext)!;
  if (ext === ".txt") return { text: new TextDecoder("utf-8", { fatal: false }).decode(bytes), attachment: { fileName: file.name, contentType, data: bytes } };

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: bytes });
    try {
      const parsed = await parser.getText();
      return { text: parsed.text ?? "", attachment: { fileName: file.name, contentType, data: bytes } };
    } finally {
      await parser.destroy();
    }
  }

  const mammoth = await import("mammoth");
  const parsed = await mammoth.extractRawText({ buffer: bytes });
  return { text: parsed.value, attachment: { fileName: file.name, contentType, data: bytes } };
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
  let attachment: { fileName: string; contentType: string; data: Buffer } | undefined;

  try {
    if (file instanceof File && file.size > 0) {
      const parsed = await textFromFile(file); fileText = parsed.text; attachment = parsed.attachment;
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
  const coreIntelligence = buildJobFitIntelligenceResult(jdText, siteEvidence);
  const intelligence = { ...coreIntelligence, research: { status: "pending" as const, citations: [], insights: [], note: "Research is queued and will update this retained inquiry with cited current evidence." } };
  const finish = async (result: ReturnType<typeof deterministicJobFit>, fallbackReason?: string) => {
    const finalIntelligence = withFinalJobFitAudit(intelligence, result);
    const sessionId = jobFitSessionFrom(request) || crypto.randomUUID();
    const inquiry = await persistJobFitInquiry({ sessionId, jdText, fileName: file instanceof File ? file.name : undefined, attachment, result: finalIntelligence });
    if (inquiry.persisted) {
      try { await start(runJobFitResearch, [inquiry.id]); }
      catch { /* The portfolio-only assessment remains available if durable research cannot be scheduled. */ }
    }
    const response = NextResponse.json({ result, intelligence: finalIntelligence, inquiry, ...(fallbackReason ? { fallbackReason } : {}) });
    response.cookies.set("job_fit_session", sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 365 * 24 * 60 * 60 });
    return response;
  };
  const agentRun = await runResumeMatchAgent({
    ownerName: profile.name,
    jdText,
    evidence: siteEvidence,
    evidenceText: evidenceBlock(siteEvidence),
    timeoutMs: settings.fallbackTimeoutSeconds * 1_000
  });

  if (agentRun.ok) {
    return finish(agentRun.result);
  }

  console.warn("[resume-match-agent] Run failed.", {
    reason: agentRun.reason,
    detail: agentRun.detail
  });

  if (shouldUseDeterministicFallback(agentRun.reason, settings.deterministicFallbackEnabled)) {
    const fallback = deterministicJobFit(jdText, siteEvidence, siteEvidence);
    return finish(fallback, agentRun.reason);
  }

  const message =
    agentRun.reason === "timeout"
      ? `The Resume Match Specialist exceeded the ${settings.fallbackTimeoutSeconds}-second timeout.`
      : `The Resume Match Specialist could not return a grounded result (${agentRun.reason}).`;

  return responseError(`${message} No rules-based score was substituted.`, 503);
}
