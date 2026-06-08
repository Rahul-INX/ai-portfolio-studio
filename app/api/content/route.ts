import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { affectedContentPaths, type EditableContentKind } from "@/lib/content-paths";
import { getExplorerItems } from "@/lib/content";
import { prisma } from "@/lib/prisma";

const baseSchema = z.object({
  kind: z.enum(["project", "case-study", "experiment", "blog", "dashboard", "skill", "certification", "timeline", "document"]),
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  tags: z.array(z.string()).default([])
});

const optionalImageSchema = z
  .string()
  .trim()
  .refine((value) => !value || value.startsWith("/") || /^https?:\/\//.test(value), {
    message: "Use a hosted image URL or an uploaded /uploads path."
  })
  .optional()
  .or(z.literal(""));

const projectSchema = baseSchema.extend({
  kind: z.literal("project"),
  subtitle: z.string().min(10),
  summary: z.string().min(20),
  description: z.string().min(20),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "MAINTAINED"]).default("ACTIVE"),
  techStack: z.array(z.string()).default([]),
  businessImpact: z.string().min(10),
  imageUrl: optionalImageSchema,
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), accent: z.boolean().optional() })).default([]),
  architectureCanvas: z
    .object({
      layers: z.array(z.string()).default([]),
      principles: z.array(z.string()).default([]),
      riskControls: z.array(z.string()).default([])
    })
    .default({ layers: [], principles: [], riskControls: [] })
});

const caseStudySchema = baseSchema.extend({
  kind: z.literal("case-study"),
  summary: z.string().min(20),
  problem: z.string().min(10),
  context: z.string().min(10),
  approach: z.string().min(10),
  businessValue: z.string().min(10),
  imageUrl: optionalImageSchema
});

const experimentSchema = baseSchema.extend({
  kind: z.literal("experiment"),
  summary: z.string().min(20),
  hypothesis: z.string().min(10),
  method: z.string().min(10),
  findings: z.string().min(10),
  nextStep: z.string().min(10),
  status: z.enum(["PLANNED", "ACTIVE", "COMPLETED", "MAINTAINED"]).default("ACTIVE"),
  imageUrl: optionalImageSchema,
  metrics: z.array(z.object({ label: z.string(), value: z.string(), accent: z.boolean().optional() })).default([])
});

const blogSchema = baseSchema.extend({
  kind: z.literal("blog"),
  excerpt: z.string().min(20),
  content: z.string().min(20),
  readTime: z.number().int().min(1).default(4),
  seoTitle: z.string().min(8),
  seoSummary: z.string().min(20),
  imageUrl: optionalImageSchema
});

const dashboardSchema = baseSchema.extend({
  kind: z.literal("dashboard"),
  summary: z.string().min(20),
  embedUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: optionalImageSchema
});

const skillSchema = z.object({
  kind: z.literal("skill"),
  name: z.string().min(2),
  category: z.string().min(2),
  level: z.number().int().min(1).max(100),
  weight: z.number().int().min(1).max(10).default(1)
});

const certificationSchema = z.object({
  kind: z.literal("certification"),
  title: z.string().min(3),
  issuer: z.string().min(3),
  issuedAt: z.string().optional(),
  url: z.string().url().optional().or(z.literal(""))
});

const timelineSchema = z.object({
  id: z.string().optional(),
  kind: z.literal("timeline"),
  title: z.string().min(3),
  period: z.string().min(3),
  description: z.string().min(10),
  signal: z.string().min(2),
  sortOrder: z.number().int().min(0)
});

const documentSchema = z.object({
  kind: z.literal("document"),
  documentKind: z.enum(["RESUME", "CV"]),
  title: z.string().min(3),
  description: z.string().min(20),
  fileUrl: z
    .string()
    .trim()
    .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), {
      message: "Use an uploaded /documents path or a hosted document URL."
    }),
  versionLabel: z.string().optional().or(z.literal(""))
});

const siteProfileSchema = z.object({
  kind: z.literal("site-profile"),
  name: z.string().min(2),
  initials: z.string().min(1).max(4),
  role: z.string().min(3),
  profileImageUrl: optionalImageSchema,
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().min(6).optional().or(z.literal("")),
  contactLocation: z.string().trim().min(2).optional().or(z.literal("")),
  heroEyebrow: z.string().min(3),
  heroTitle: z.string().min(10),
  heroSummary: z.string().min(20),
  primaryCtaLabel: z.string().min(2),
  secondaryCtaLabel: z.string().min(2),
  focusLabel: z.string().min(2),
  focusValue: z.string().min(2),
  styleLabel: z.string().min(2),
  styleValue: z.string().min(2),
  modelLabel: z.string().min(2),
  modelValue: z.string().min(2),
  explorerEyebrow: z.string().min(3),
  explorerTitle: z.string().min(10),
  explorerDescription: z.string().min(20),
  timelineEyebrow: z.string().min(3),
  timelineTitle: z.string().min(10),
  timelineDescription: z.string().min(20),
  adminEyebrow: z.string().min(3),
  adminTitle: z.string().min(10),
  adminDescription: z.string().min(20),
  seoTitle: z.string().min(10),
  seoDescription: z.string().min(20)
});

const skillSchemaWithId = skillSchema.extend({ id: z.string().optional() });
const certificationSchemaWithId = certificationSchema.extend({ id: z.string().optional() });

const contentSchema = z.discriminatedUnion("kind", [
  projectSchema,
  caseStudySchema,
  experimentSchema,
  blogSchema,
  dashboardSchema,
  skillSchemaWithId,
  certificationSchemaWithId,
  timelineSchema,
  documentSchema,
  siteProfileSchema
]);

function publishedResponse(item: unknown, kind: EditableContentKind, slug?: string) {
  const paths = affectedContentPaths(kind, slug);
  for (const path of paths) revalidatePath(path);
  revalidatePath("/admin");
  revalidatePath("/admin/new-project");
  return NextResponse.json({ item, paths }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ items: await getExplorerItems() });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is required for CMS writes." }, { status: 503 });
  }

  const body = await request.json();
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.kind === "project") {
    const { kind: _kind, imageUrl, startDate, endDate, ...data } = parsed.data;
    void _kind;
    const published = {
      ...data,
      imageUrl: imageUrl || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      visibility: "PUBLISHED" as const,
      publishedAt: new Date()
    };
    const project = await prisma.project.upsert({
      where: { slug: data.slug },
      update: published,
      create: published
    });
    return publishedResponse(project, "project", data.slug);
  }

  if (parsed.data.kind === "case-study") {
    const { kind: _kind, imageUrl, ...data } = parsed.data;
    void _kind;
    const published = { ...data, imageUrl: imageUrl || null, visibility: "PUBLISHED" as const, publishedAt: new Date() };
    const caseStudy = await prisma.caseStudy.upsert({
      where: { slug: data.slug },
      update: published,
      create: published
    });
    return publishedResponse(caseStudy, "case-study", data.slug);
  }

  if (parsed.data.kind === "experiment") {
    const { kind: _kind, imageUrl, ...data } = parsed.data;
    void _kind;
    const published = { ...data, imageUrl: imageUrl || null, visibility: "PUBLISHED" as const, publishedAt: new Date() };
    const experiment = await prisma.experiment.upsert({
      where: { slug: data.slug },
      update: published,
      create: published
    });
    return publishedResponse(experiment, "experiment", data.slug);
  }

  if (parsed.data.kind === "blog") {
    const { kind: _kind, imageUrl, ...data } = parsed.data;
    void _kind;
    const published = { ...data, imageUrl: imageUrl || null, visibility: "PUBLISHED" as const, publishedAt: new Date() };
    const blog = await prisma.blog.upsert({
      where: { slug: data.slug },
      update: published,
      create: published
    });
    return publishedResponse(blog, "blog", data.slug);
  }

  if (parsed.data.kind === "skill") {
    const { kind: _kind, id, ...data } = parsed.data;
    void _kind;
    const skill = id ? await prisma.skill.update({ where: { id }, data }) : await prisma.skill.create({ data });
    return publishedResponse(skill, "skill");
  }

  if (parsed.data.kind === "certification") {
    const { kind: _kind, id, issuedAt, url, ...data } = parsed.data;
    void _kind;
    const certificationData = {
      ...data,
      issuedAt: issuedAt ? new Date(issuedAt) : null,
      url: url || null
    };
    const certification = id
      ? await prisma.certification.update({ where: { id }, data: certificationData })
      : await prisma.certification.create({ data: certificationData });
    return publishedResponse(certification, "certification");
  }

  if (parsed.data.kind === "timeline") {
    const { kind: _kind, id, ...data } = parsed.data;
    void _kind;
    const event = id ? await prisma.timelineEvent.update({ where: { id }, data }) : await prisma.timelineEvent.create({ data });
    return publishedResponse(event, "timeline");
  }

  if (parsed.data.kind === "document") {
    const { kind: _kind, documentKind, versionLabel, ...data } = parsed.data;
    void _kind;
    const document = await prisma.portfolioDocument.upsert({
      where: { kind: documentKind },
      update: {
        ...data,
        kind: documentKind,
        versionLabel: versionLabel || null,
        visibility: "PUBLISHED",
        publishedAt: new Date()
      },
      create: {
        ...data,
        kind: documentKind,
        versionLabel: versionLabel || null,
        visibility: "PUBLISHED",
        publishedAt: new Date()
      }
    });
    return publishedResponse(document, "document");
  }

  if (parsed.data.kind === "site-profile") {
    const { kind: _kind, profileImageUrl, contactEmail, contactPhone, contactLocation, ...data } = parsed.data;
    void _kind;
    const profileData = {
      ...data,
      profileImageUrl: profileImageUrl || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      contactLocation: contactLocation || null
    };
    const profile = await prisma.siteProfile.upsert({
      where: { id: "main" },
      update: profileData,
      create: { id: "main", ...profileData }
    });
    return publishedResponse(profile, "site-profile");
  }

  const { kind: _kind, ...data } = parsed.data;
  void _kind;
  const published = { ...data, visibility: "PUBLISHED" as const, publishedAt: new Date() };
  const dashboard = await prisma.dashboard.upsert({
    where: { slug: data.slug },
    update: {
      ...published,
      embedUrl: published.embedUrl || null,
      imageUrl: published.imageUrl || null
    },
    create: {
      ...published,
      embedUrl: published.embedUrl || null,
      imageUrl: published.imageUrl || null
    }
  });

  return publishedResponse(dashboard, "dashboard", data.slug);
}
