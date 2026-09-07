import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions, isAdminSession } from "@/lib/auth";
import { findByteIdenticalDriveAsset, type DriveFolder, uploadBufferToDrive, verifyDriveConnection } from "@/lib/google-drive";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const bodySchema = z.object({ confirm: z.literal(true), limit: z.number().int().min(1).max(20).default(10) });

async function denied() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminSession(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

function replaced(value: string | null, source: string, target: string) { return value?.includes(source) ? value.replaceAll(source, target) : value; }

async function destinationFor(source: string): Promise<DriveFolder> {
  if (await prisma.siteProfile.count({ where: { profileImageUrl: source } })) return "profile";
  const document = await prisma.portfolioDocument.findFirst({ where: { fileUrl: source }, select: { kind: true } });
  if (document?.kind === "RESUME") return "resume";
  if (document?.kind === "CV") return "cv";
  if (await prisma.project.count({ where: { imageUrl: source } })) return "projects";
  if (await prisma.caseStudy.count({ where: { imageUrl: source } })) return "case-studies";
  if (await prisma.experiment.count({ where: { imageUrl: source } })) return "experiments";
  if (await prisma.blog.count({ where: { OR: [{ imageUrl: source }, { content: { contains: source } }] } })) return "blogs";
  if (await prisma.dashboard.count({ where: { imageUrl: source } })) return "dashboards";
  if (await prisma.achievement.count({ where: { imageUrl: source } })) return "achievements";
  return "supporting";
}

async function hasReference(source: string) {
  const contains = { contains: source };
  const [profile, document, project, caseStudy, experiment, blog, dashboard, achievement, certification] = await Promise.all([
    prisma.siteProfile.count({ where: { profileImageUrl: source } }),
    prisma.portfolioDocument.count({ where: { fileUrl: source } }),
    prisma.project.count({ where: { OR: [{ subtitle: contains }, { summary: contains }, { description: contains }, { businessImpact: contains }, { githubUrl: contains }, { demoUrl: contains }, { imageUrl: source }] } }),
    prisma.caseStudy.count({ where: { OR: [{ summary: contains }, { problem: contains }, { context: contains }, { approach: contains }, { businessValue: contains }, { imageUrl: source }] } }),
    prisma.experiment.count({ where: { OR: [{ summary: contains }, { hypothesis: contains }, { method: contains }, { findings: contains }, { nextStep: contains }, { imageUrl: source }] } }),
    prisma.blog.count({ where: { OR: [{ excerpt: contains }, { content: contains }, { seoTitle: contains }, { seoSummary: contains }, { imageUrl: source }] } }),
    prisma.dashboard.count({ where: { OR: [{ summary: contains }, { embedUrl: contains }, { imageUrl: source }] } }),
    prisma.achievement.count({ where: { OR: [{ summary: contains }, { proofUrl: contains }, { imageUrl: source }] } }),
    prisma.certification.count({ where: { url: contains } }),
  ]);
  return Boolean(profile || document || project || caseStudy || experiment || blog || dashboard || achievement || certification);
}

async function replaceReferences(source: string, target: string) {
  const [projects, cases, experiments, blogs, dashboards, achievements, certifications] = await Promise.all([prisma.project.findMany(), prisma.caseStudy.findMany(), prisma.experiment.findMany(), prisma.blog.findMany(), prisma.dashboard.findMany(), prisma.achievement.findMany(), prisma.certification.findMany()]);
  await prisma.$transaction([
    prisma.siteProfile.updateMany({ where: { profileImageUrl: source }, data: { profileImageUrl: target } }),
    prisma.portfolioDocument.updateMany({ where: { fileUrl: source }, data: { fileUrl: target } }),
    ...achievements.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.achievement.update({ where: { id: item.id }, data: { summary: replaced(item.summary, source, target) ?? item.summary, proofUrl: replaced(item.proofUrl, source, target), imageUrl: replaced(item.imageUrl, source, target) } })),
    ...certifications.filter((item) => item.url?.includes(source)).map((item) => prisma.certification.update({ where: { id: item.id }, data: { url: replaced(item.url, source, target) } })),
    ...projects.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.project.update({ where: { id: item.id }, data: { imageUrl: replaced(item.imageUrl, source, target), subtitle: replaced(item.subtitle, source, target) ?? item.subtitle, summary: replaced(item.summary, source, target) ?? item.summary, description: replaced(item.description, source, target) ?? item.description, businessImpact: replaced(item.businessImpact, source, target) ?? item.businessImpact, githubUrl: replaced(item.githubUrl, source, target), demoUrl: replaced(item.demoUrl, source, target) } })),
    ...cases.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.caseStudy.update({ where: { id: item.id }, data: { imageUrl: replaced(item.imageUrl, source, target), summary: replaced(item.summary, source, target) ?? item.summary, problem: replaced(item.problem, source, target) ?? item.problem, context: replaced(item.context, source, target) ?? item.context, approach: replaced(item.approach, source, target) ?? item.approach, businessValue: replaced(item.businessValue, source, target) ?? item.businessValue } })),
    ...experiments.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.experiment.update({ where: { id: item.id }, data: { imageUrl: replaced(item.imageUrl, source, target), summary: replaced(item.summary, source, target) ?? item.summary, hypothesis: replaced(item.hypothesis, source, target) ?? item.hypothesis, method: replaced(item.method, source, target) ?? item.method, findings: replaced(item.findings, source, target) ?? item.findings, nextStep: replaced(item.nextStep, source, target) ?? item.nextStep } })),
    ...blogs.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.blog.update({ where: { id: item.id }, data: { imageUrl: replaced(item.imageUrl, source, target), excerpt: replaced(item.excerpt, source, target) ?? item.excerpt, content: replaced(item.content, source, target) ?? item.content, seoTitle: replaced(item.seoTitle, source, target) ?? item.seoTitle, seoSummary: replaced(item.seoSummary, source, target) ?? item.seoSummary } })),
    ...dashboards.filter((item) => Object.values(item).some((value) => typeof value === "string" && value.includes(source))).map((item) => prisma.dashboard.update({ where: { id: item.id }, data: { imageUrl: replaced(item.imageUrl, source, target), summary: replaced(item.summary, source, target) ?? item.summary, embedUrl: replaced(item.embedUrl, source, target) } })),
  ]);
}

export async function GET() {
  const error = await denied(); if (error) return error;
  const legacy = await prisma.storedFile.aggregate({ _count: true, _sum: { size: true } });
  return NextResponse.json({ remaining: legacy._count, bytes: legacy._sum.size ?? 0 });
}

export async function POST(request: Request) {
  const error = await denied(); if (error) return error;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Confirm migration before moving and cleaning legacy Neon media." }, { status: 400 });
  try { await verifyDriveConnection(); } catch { return NextResponse.json({ error: "Verify the Google Drive connection before migration." }, { status: 409 }); }
  const files = await prisma.storedFile.findMany({ orderBy: { createdAt: "asc" }, take: parsed.data.limit });
  let migrated = 0; let removedUnused = 0; const failures: string[] = [];
  for (const file of files) {
    const source = `/api/files/${encodeURIComponent(file.id)}`;
    try {
      const destination = await destinationFor(source);
      const used = await hasReference(source);
      if (!used) { await prisma.storedFile.delete({ where: { id: file.id } }); removedUnused += 1; continue; }
      const data = Buffer.from(file.data);
      const candidates = await prisma.mediaAsset.findMany({ where: { fileName: file.fileName, contentType: file.contentType, size: file.size, folder: destination, trashedAt: null }, select: { id: true, externalId: true } });
      const existing = await findByteIdenticalDriveAsset(data, candidates);
      const target = existing ? `/api/media/${encodeURIComponent(existing.id)}` : (await uploadBufferToDrive({ fileName: file.fileName, contentType: file.contentType, data, folder: destination })).url;
      await replaceReferences(source, target);
      await prisma.storedFile.delete({ where: { id: file.id } });
      migrated += 1;
    } catch { failures.push(file.fileName); }
  }
  const remaining = await prisma.storedFile.count();
  return NextResponse.json({ migrated, removedUnused, remaining, failures });
}
