import { canReadDatabase, markDatabaseUnavailable } from "@/lib/database-availability";
import { uploadBufferToDrive } from "@/lib/google-drive";
import { renderJobFitRecruiterBrief } from "@/lib/job-fit-brief";
import { decryptJobFitData, encryptJobFitData, jobFitSessionHash, jobFitShareTokenHash, newJobFitShareToken } from "@/lib/job-fit-data-crypto";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";
import { prisma } from "@/lib/prisma";

export type JobFitPersistedInquiry = {
  id: string;
  status: string;
  persisted: boolean;
  briefAvailable: boolean;
  sourceAvailable: boolean;
};

const oneYear = 365 * 24 * 60 * 60 * 1_000;

export function jobFitInquiryStatus(researchStatus: JobFitIntelligenceResult["research"]["status"]) {
  return researchStatus === "complete" ? "COMPLETE" : "CORE_COMPLETE";
}

export function jobFitEncryptedColumns(value: { encryptedValue: string; iv: string; authTag: string }) {
  return { jdEncryptedValue: value.encryptedValue, jdIv: value.iv, jdAuthTag: value.authTag };
}

export function jobFitSourceEncryptedColumns(value: { encryptedValue: string; iv: string; authTag: string }) {
  return { sourceEncryptedValue: value.encryptedValue, sourceIv: value.iv, sourceAuthTag: value.authTag };
}

export function jobFitResearchCompletionStatus(status: JobFitIntelligenceResult["research"]["status"]) {
  return status === "complete" ? "COMPLETE" : "CORE_COMPLETE";
}

async function saveJobFitBrief(inquiryId: string, result: JobFitIntelligenceResult) {
  try {
    const title = result.metadata.role?.replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase() || "role";
    const uploaded = await uploadBufferToDrive({
      fileName: `job-fit-${title}-brief.md`, contentType: "text/markdown; charset=utf-8", data: Buffer.from(renderJobFitRecruiterBrief(result)), folder: "supporting",
    });
    await prisma.jobFitInquiry.update({ where: { id: inquiryId }, data: { briefAssetId: uploaded.asset.id } });
    await prisma.jobFitStageEvent.create({ data: { inquiryId, stage: "recruiter-brief", status: "complete", detail: "A private, cited recruiter brief was saved to Drive." } });
    return true;
  } catch {
    // ponytail: Drive is an optional artifact sink; add queued retries when a durable worker is introduced.
    return false;
  }
}

async function saveJobFitSource(inquiryId: string, attachment?: { fileName: string; contentType: string; data: Buffer }) {
  if (!attachment) return false;
  try {
    const uploaded = await uploadBufferToDrive({ ...attachment, folder: "supporting" });
    await prisma.jobFitInquiry.update({ where: { id: inquiryId }, data: { sourceAssetId: uploaded.asset.id } });
    await prisma.jobFitStageEvent.create({ data: { inquiryId, stage: "source-document", status: "complete", detail: "The original JD attachment was retained in private Drive storage." } });
    return true;
  } catch {
    // ponytail: original source retention is best effort until Drive retry jobs are added.
    return false;
  }
}

export async function persistJobFitInquiry(input: {
  sessionId: string;
  jdText: string;
  fileName?: string;
  attachment?: { fileName: string; contentType: string; data: Buffer };
  result: JobFitIntelligenceResult;
}): Promise<JobFitPersistedInquiry> {
  if (!canReadDatabase() || !process.env.JOB_FIT_DATA_ENCRYPTION_KEY) {
    return { id: crypto.randomUUID(), status: "CORE_COMPLETE", persisted: false, briefAvailable: false, sourceAvailable: false };
  }
  try {
    const encrypted = encryptJobFitData(input.jdText);
    const sourceEncrypted = input.attachment ? encryptJobFitData(input.attachment.data.toString("base64")) : null;
    const status = jobFitInquiryStatus(input.result.research.status);
    const inquiry = await prisma.jobFitInquiry.create({
      data: {
        sessionHash: jobFitSessionHash(input.sessionId),
        company: input.result.metadata.company,
        role: input.result.metadata.role,
        location: input.result.metadata.location,
        status,
        ...jobFitEncryptedColumns(encrypted),
        fileName: input.fileName,
        sourceContentType: input.attachment?.contentType,
        ...(sourceEncrypted ? jobFitSourceEncryptedColumns(sourceEncrypted) : {}),
        coreResult: input.result,
        expiresAt: new Date(Date.now() + oneYear),
        ...(status === "COMPLETE" ? { completedAt: new Date() } : {}),
        events: { create: [
          { stage: "intake", status: "complete", detail: "JD parsed and retained securely." },
          { stage: "portfolio-evidence", status: "complete", detail: "Requirement-level portfolio evidence was collected." },
          { stage: "research", status: input.result.research.status, detail: input.result.research.note },
          ...(input.attachment ? [{ stage: "source-document", status: "complete", detail: "The original JD attachment was retained in encrypted database storage." }] : []),
        ] },
      },
    });
    await saveJobFitSource(inquiry.id, input.attachment);
    return { id: inquiry.id, status: inquiry.status, persisted: true, briefAvailable: true, sourceAvailable: Boolean(input.attachment) };
  } catch (error) {
    markDatabaseUnavailable(error);
    return { id: crypto.randomUUID(), status: "CORE_COMPLETE", persisted: false, briefAvailable: false, sourceAvailable: false };
  }
}

export async function beginJobFitResearch(inquiryId: string) {
  if (!canReadDatabase()) return null;
  try {
    const inquiry = await prisma.jobFitInquiry.update({ where: { id: inquiryId }, data: { status: "RESEARCHING" }, select: { company: true, role: true, location: true, coreResult: true } });
    await prisma.jobFitStageEvent.create({ data: { inquiryId, stage: "research", status: "running", detail: "Collecting current company, role, and market evidence." } });
    return { ...inquiry, coreResult: inquiry.coreResult as unknown as JobFitIntelligenceResult };
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function finishJobFitResearch(inquiryId: string, research: JobFitIntelligenceResult["research"]) {
  if (!canReadDatabase()) return false;
  try {
    const inquiry = await prisma.jobFitInquiry.findUnique({ where: { id: inquiryId }, select: { coreResult: true } });
    if (!inquiry?.coreResult) return false;
    const core = inquiry.coreResult as unknown as JobFitIntelligenceResult;
    const status = jobFitResearchCompletionStatus(research.status);
    const result = { ...core, research };
    await prisma.jobFitInquiry.update({ where: { id: inquiryId }, data: { status, coreResult: result, researchResult: research, ...(status === "COMPLETE" ? { completedAt: new Date() } : {}) } });
    await prisma.jobFitStageEvent.create({ data: { inquiryId, stage: "research", status: research.status, detail: research.note } });
    await saveJobFitBrief(inquiryId, result);
    return true;
  } catch (error) { markDatabaseUnavailable(error); return false; }
}

export async function getJobFitInquiry(inquiryId: string, sessionId: string) {
  if (!canReadDatabase() || !process.env.JOB_FIT_DATA_ENCRYPTION_KEY) return null;
  try {
    return await prisma.jobFitInquiry.findFirst({
      where: { id: inquiryId, sessionHash: jobFitSessionHash(sessionId), expiresAt: { gt: new Date() } },
      include: { events: { orderBy: { createdAt: "asc" } }, chats: { orderBy: { createdAt: "asc" } }, briefAsset: true, sourceAsset: true },
    });
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function appendJobFitChatMessage(inquiryId: string, role: "user" | "assistant", content: string, citations?: string[]) {
  if (!canReadDatabase() || !process.env.JOB_FIT_DATA_ENCRYPTION_KEY) return;
  try { await prisma.jobFitChatMessage.create({ data: { inquiryId, role, content, citations } }); }
  catch (error) { markDatabaseUnavailable(error); }
}

export async function listAdminJobFitInquiries() {
  if (!canReadDatabase()) return null;
  try {
    const [total, completed, inquiries] = await Promise.all([
      prisma.jobFitInquiry.count(),
      prisma.jobFitInquiry.count({ where: { status: "COMPLETE" } }),
      prisma.jobFitInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, company: true, role: true, location: true, status: true, createdAt: true, completedAt: true, expiresAt: true, pinnedAt: true, publicApprovedAt: true } }),
    ]);
    return { total, completed, inquiries };
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function getAdminJobFitInquiry(inquiryId: string) {
  if (!canReadDatabase() || !process.env.JOB_FIT_DATA_ENCRYPTION_KEY) return null;
  try {
    const inquiry = await prisma.jobFitInquiry.findUnique({ where: { id: inquiryId }, include: { events: { orderBy: { createdAt: "asc" } }, chats: { orderBy: { createdAt: "asc" } }, briefAsset: true, sourceAsset: true } });
    if (!inquiry) return null;
    const jdText = inquiry.jdEncryptedValue && inquiry.jdIv && inquiry.jdAuthTag ? decryptJobFitData({ encryptedValue: inquiry.jdEncryptedValue, iv: inquiry.jdIv, authTag: inquiry.jdAuthTag }) : null;
    return { ...inquiry, jdText };
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function createJobFitShareLink(inquiryId: string, sessionId: string) {
  const inquiry = await getJobFitInquiry(inquiryId, sessionId);
  if (!inquiry) return null;
  try {
    const token = newJobFitShareToken(); const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1_000);
    await prisma.jobFitShareLink.create({ data: { inquiryId: inquiry.id, tokenHash: jobFitShareTokenHash(token), expiresAt } });
    return { token, expiresAt };
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function getPublicJobFitShare(token: string) {
  if (!canReadDatabase() || !process.env.JOB_FIT_DATA_ENCRYPTION_KEY) return null;
  try {
    const link = await prisma.jobFitShareLink.findFirst({ where: { tokenHash: jobFitShareTokenHash(token), expiresAt: { gt: new Date() }, revokedAt: null }, include: { inquiry: { select: { company: true, role: true, location: true, coreResult: true, createdAt: true } } } });
    if (!link?.inquiry.coreResult) return null;
    return { expiresAt: link.expiresAt, createdAt: link.inquiry.createdAt, company: link.inquiry.company, role: link.inquiry.role, location: link.inquiry.location, result: link.inquiry.coreResult as unknown as JobFitIntelligenceResult };
  } catch (error) { markDatabaseUnavailable(error); return null; }
}

export async function getPublicJobFitActivity() {
  if (!canReadDatabase()) return [];
  try {
    const rows = await prisma.jobFitInquiry.findMany({ where: { publicApprovedAt: { not: null }, role: { not: null } }, orderBy: { publicApprovedAt: "desc" }, select: { role: true, location: true }, take: 40 });
    const seen = new Set<string>();
    return rows.flatMap((row) => { const label = [row.role, row.location].filter(Boolean).join(" · "); if (!label || seen.has(label)) return []; seen.add(label); return [label]; }).slice(0, 8);
  } catch (error) { markDatabaseUnavailable(error); return []; }
}

export async function setJobFitPublicApproval(inquiryId: string, approved: boolean) {
  if (!canReadDatabase()) return null;
  try { return await prisma.jobFitInquiry.update({ where: { id: inquiryId }, data: { publicApprovedAt: approved ? new Date() : null }, select: { id: true, publicApprovedAt: true } }); }
  catch (error) { markDatabaseUnavailable(error); return null; }
}
