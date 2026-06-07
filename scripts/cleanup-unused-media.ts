import { existsSync } from "fs";
import { readdir, rm } from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
const uploadDir = path.join(process.cwd(), "public", "uploads");

function isLocalUpload(value?: string | null) {
  return Boolean(value?.startsWith("/uploads/"));
}

function uploadPath(value: string) {
  return path.join(process.cwd(), "public", value.replace(/^\//, ""));
}

function markdownImages(value: string) {
  return Array.from(value.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)).map((match) => match[1].trim());
}

function removeBrokenMarkdownImages(value: string, broken: Set<string>) {
  if (!broken.size) return value;
  return value
    .split(/\r?\n/)
    .filter((line) => !Array.from(broken).some((url) => line.includes(`](${url})`)))
    .join("\n");
}

async function cleanup() {
  const referenced = new Set<string>();
  const broken = new Set<string>();

  const [projects, caseStudies, experiments, blogs, dashboards] = await Promise.all([
    prisma.project.findMany(),
    prisma.caseStudy.findMany(),
    prisma.experiment.findMany(),
    prisma.blog.findMany(),
    prisma.dashboard.findMany()
  ]);

  const track = (url?: string | null) => {
    if (!url) return;
    referenced.add(url);
    if (isLocalUpload(url) && !existsSync(uploadPath(url))) broken.add(url);
  };

  for (const item of projects) {
    track(item.imageUrl);
    for (const url of [...markdownImages(item.description), ...markdownImages(item.businessImpact)]) track(url);
  }
  for (const item of caseStudies) {
    track(item.imageUrl);
    for (const url of [
      ...markdownImages(item.problem),
      ...markdownImages(item.context),
      ...markdownImages(item.approach),
      ...markdownImages(item.businessValue)
    ]) track(url);
  }
  for (const item of experiments) {
    track(item.imageUrl);
    for (const url of [
      ...markdownImages(item.hypothesis),
      ...markdownImages(item.method),
      ...markdownImages(item.findings),
      ...markdownImages(item.nextStep)
    ]) track(url);
  }
  for (const item of blogs) {
    track(item.imageUrl);
    for (const url of markdownImages(item.content)) track(url);
  }
  for (const item of dashboards) track(item.imageUrl);

  if (broken.size) {
    await Promise.all([
      ...projects.map((item) =>
        prisma.project.update({
          where: { id: item.id },
          data: {
            imageUrl: broken.has(item.imageUrl ?? "") ? null : item.imageUrl,
            description: removeBrokenMarkdownImages(item.description, broken),
            businessImpact: removeBrokenMarkdownImages(item.businessImpact, broken)
          }
        })
      ),
      ...caseStudies.map((item) =>
        prisma.caseStudy.update({
          where: { id: item.id },
          data: {
            imageUrl: broken.has(item.imageUrl ?? "") ? null : item.imageUrl,
            problem: removeBrokenMarkdownImages(item.problem, broken),
            context: removeBrokenMarkdownImages(item.context, broken),
            approach: removeBrokenMarkdownImages(item.approach, broken),
            businessValue: removeBrokenMarkdownImages(item.businessValue, broken)
          }
        })
      ),
      ...experiments.map((item) =>
        prisma.experiment.update({
          where: { id: item.id },
          data: {
            imageUrl: broken.has(item.imageUrl ?? "") ? null : item.imageUrl,
            hypothesis: removeBrokenMarkdownImages(item.hypothesis, broken),
            method: removeBrokenMarkdownImages(item.method, broken),
            findings: removeBrokenMarkdownImages(item.findings, broken),
            nextStep: removeBrokenMarkdownImages(item.nextStep, broken)
          }
        })
      ),
      ...blogs.map((item) =>
        prisma.blog.update({
          where: { id: item.id },
          data: {
            imageUrl: broken.has(item.imageUrl ?? "") ? null : item.imageUrl,
            content: removeBrokenMarkdownImages(item.content, broken)
          }
        })
      ),
      ...dashboards.map((item) =>
        broken.has(item.imageUrl ?? "")
          ? prisma.dashboard.update({ where: { id: item.id }, data: { imageUrl: null } })
          : Promise.resolve(item)
      )
    ]);
  }

  let deletedFiles = 0;
  if (existsSync(uploadDir)) {
    const files = await readdir(uploadDir);
    for (const file of files) {
      const url = `/uploads/${file}`;
      if (!referenced.has(url)) {
        await rm(path.join(uploadDir, file), { force: true });
        deletedFiles += 1;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        referencedImages: referenced.size,
        brokenDatabaseReferencesRemoved: broken.size,
        unusedUploadFilesDeleted: deletedFiles
      },
      null,
      2
    )
  );
}

cleanup()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
