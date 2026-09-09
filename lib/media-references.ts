import { prisma } from "@/lib/prisma";

export async function mediaReferences(url: string) {
  const contains = { contains: url };
  const assetId = url.match(/^\/api\/media\/([^/]+)$/)?.[1];
  const [project, caseStudy, experiment, blog, dashboard, achievement, document, profile, markdown, jobFitBrief, jobFitSource] = await Promise.all([
    prisma.project.count({ where: { OR: [{ imageUrl: url }, { subtitle: contains }, { summary: contains }, { description: contains }, { businessImpact: contains }, { githubUrl: contains }, { demoUrl: contains }] } }),
    prisma.caseStudy.count({ where: { OR: [{ imageUrl: url }, { summary: contains }, { problem: contains }, { context: contains }, { approach: contains }, { businessValue: contains }] } }),
    prisma.experiment.count({ where: { OR: [{ imageUrl: url }, { summary: contains }, { hypothesis: contains }, { method: contains }, { findings: contains }, { nextStep: contains }] } }),
    prisma.blog.count({ where: { OR: [{ imageUrl: url }, { excerpt: contains }, { content: contains }, { seoTitle: contains }, { seoSummary: contains }] } }),
    prisma.dashboard.count({ where: { OR: [{ imageUrl: url }, { summary: contains }, { embedUrl: contains }] } }),
    prisma.achievement.count({ where: { OR: [{ imageUrl: url }, { summary: contains }, { proofUrl: contains }] } }),
    prisma.portfolioDocument.count({ where: { fileUrl: url } }), prisma.siteProfile.count({ where: { profileImageUrl: url } }), prisma.certification.count({ where: { url: contains } }),
    assetId ? prisma.jobFitInquiry.count({ where: { briefAssetId: assetId } }) : Promise.resolve(0),
    assetId ? prisma.jobFitInquiry.count({ where: { sourceAssetId: assetId } }) : Promise.resolve(0),
  ]);
  const [publicProject, publicCaseStudy, publicExperiment, publicBlog, publicDashboard, publicAchievement, publicDocument] = await Promise.all([
    prisma.project.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { subtitle: contains }, { summary: contains }, { description: contains }, { businessImpact: contains }, { githubUrl: contains }, { demoUrl: contains }] } }),
    prisma.caseStudy.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { summary: contains }, { problem: contains }, { context: contains }, { approach: contains }, { businessValue: contains }] } }),
    prisma.experiment.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { summary: contains }, { hypothesis: contains }, { method: contains }, { findings: contains }, { nextStep: contains }] } }),
    prisma.blog.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { excerpt: contains }, { content: contains }, { seoTitle: contains }, { seoSummary: contains }] } }),
    prisma.dashboard.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { summary: contains }, { embedUrl: contains }] } }),
    prisma.achievement.count({ where: { visibility: "PUBLISHED", OR: [{ imageUrl: url }, { summary: contains }, { proofUrl: contains }] } }),
    prisma.portfolioDocument.count({ where: { fileUrl: url, visibility: "PUBLISHED" } }),
  ]);
  return { total: project + caseStudy + experiment + blog + dashboard + achievement + document + profile + markdown + jobFitBrief + jobFitSource, public: publicProject + publicCaseStudy + publicExperiment + publicBlog + publicDashboard + publicAchievement + publicDocument + profile + markdown };
}
