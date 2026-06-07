import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import {
  safeBlogs,
  safeCaseStudies,
  safeCertifications,
  safeDashboards,
  safeExperiments,
  safeProjects,
  safePortfolioDocuments,
  safeSiteProfile,
  safeSkills,
  safeTimeline
} from "../lib/safe-content";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "change-me";

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: await hash(password, 12)
    },
    create: {
      email,
      name: "Portfolio Admin",
      passwordHash: await hash(password, 12)
    }
  });

  await prisma.siteProfile.upsert({
    where: { id: "main" },
    update: safeSiteProfile,
    create: safeSiteProfile
  });

  await prisma.jobFitSettings.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      deterministicFallbackEnabled: true,
      fallbackTimeoutSeconds: 45
    }
  });

  await prisma.project.deleteMany({ where: { slug: { notIn: safeProjects.map((item) => item.slug) } } });
  await prisma.caseStudy.deleteMany({ where: { slug: { notIn: safeCaseStudies.map((item) => item.slug) } } });
  await prisma.experiment.deleteMany({ where: { slug: { notIn: safeExperiments.map((item) => item.slug) } } });
  await prisma.blog.deleteMany({ where: { slug: { notIn: safeBlogs.map((item) => item.slug) } } });
  await prisma.dashboard.deleteMany({ where: { slug: { notIn: safeDashboards.map((item) => item.slug) } } });

  for (const project of safeProjects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        title: project.title,
        subtitle: project.subtitle,
        summary: project.summary,
        description: project.description,
        status: project.status,
        visibility: "PUBLISHED",
        techStack: project.techStack,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        imageUrl: project.imageUrl,
        metrics: project.metrics,
        businessImpact: project.businessImpact,
        architectureCanvas: project.architectureCanvas,
        featured: Boolean(project.featured),
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        publishedAt: project.publishedAt ? new Date(project.publishedAt) : new Date()
      },
      create: {
        slug: project.slug,
        title: project.title,
        subtitle: project.subtitle,
        summary: project.summary,
        description: project.description,
        status: project.status,
        visibility: "PUBLISHED",
        techStack: project.techStack,
        tags: project.tags,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        imageUrl: project.imageUrl,
        metrics: project.metrics,
        businessImpact: project.businessImpact,
        architectureCanvas: project.architectureCanvas,
        featured: Boolean(project.featured),
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.endDate ? new Date(project.endDate) : null,
        publishedAt: project.publishedAt ? new Date(project.publishedAt) : new Date()
      }
    });
  }

  for (const caseStudy of safeCaseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: caseStudy.slug },
      update: {
        title: caseStudy.title,
        summary: caseStudy.summary,
        problem: caseStudy.problem,
        context: caseStudy.context,
        approach: caseStudy.approach,
        businessValue: caseStudy.businessValue,
        imageUrl: caseStudy.imageUrl,
        tags: caseStudy.tags,
        visibility: "PUBLISHED",
        publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : new Date()
      },
      create: {
        slug: caseStudy.slug,
        title: caseStudy.title,
        summary: caseStudy.summary,
        problem: caseStudy.problem,
        context: caseStudy.context,
        approach: caseStudy.approach,
        businessValue: caseStudy.businessValue,
        imageUrl: caseStudy.imageUrl,
        tags: caseStudy.tags,
        visibility: "PUBLISHED",
        publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : new Date()
      }
    });
  }

  for (const experiment of safeExperiments) {
    await prisma.experiment.upsert({
      where: { slug: experiment.slug },
      update: {
        title: experiment.title,
        summary: experiment.summary,
        hypothesis: experiment.hypothesis,
        method: experiment.method,
        findings: experiment.findings,
        nextStep: experiment.nextStep,
        status: experiment.status,
        tags: experiment.tags,
        metrics: experiment.metrics,
        imageUrl: experiment.imageUrl,
        visibility: "PUBLISHED",
        publishedAt: experiment.publishedAt ? new Date(experiment.publishedAt) : new Date()
      },
      create: {
        slug: experiment.slug,
        title: experiment.title,
        summary: experiment.summary,
        hypothesis: experiment.hypothesis,
        method: experiment.method,
        findings: experiment.findings,
        nextStep: experiment.nextStep,
        status: experiment.status,
        tags: experiment.tags,
        metrics: experiment.metrics,
        imageUrl: experiment.imageUrl,
        visibility: "PUBLISHED",
        publishedAt: experiment.publishedAt ? new Date(experiment.publishedAt) : new Date()
      }
    });
  }

  for (const blog of safeBlogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        tags: blog.tags,
        readTime: blog.readTime,
        seoTitle: blog.seoTitle,
        seoSummary: blog.seoSummary,
        imageUrl: blog.imageUrl,
        visibility: "PUBLISHED",
        publishedAt: blog.publishedAt ? new Date(blog.publishedAt) : new Date()
      },
      create: {
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        tags: blog.tags,
        readTime: blog.readTime,
        seoTitle: blog.seoTitle,
        seoSummary: blog.seoSummary,
        imageUrl: blog.imageUrl,
        visibility: "PUBLISHED",
        publishedAt: blog.publishedAt ? new Date(blog.publishedAt) : new Date()
      }
    });
  }

  for (const dashboard of safeDashboards) {
    await prisma.dashboard.upsert({
      where: { slug: dashboard.slug },
      update: {
        title: dashboard.title,
        summary: dashboard.summary,
        embedUrl: dashboard.embedUrl,
        imageUrl: dashboard.imageUrl,
        tags: dashboard.tags,
        visibility: "PUBLISHED",
        publishedAt: dashboard.publishedAt ? new Date(dashboard.publishedAt) : new Date()
      },
      create: {
        slug: dashboard.slug,
        title: dashboard.title,
        summary: dashboard.summary,
        embedUrl: dashboard.embedUrl,
        imageUrl: dashboard.imageUrl,
        tags: dashboard.tags,
        visibility: "PUBLISHED",
        publishedAt: dashboard.publishedAt ? new Date(dashboard.publishedAt) : new Date()
      }
    });
  }

  await prisma.skill.deleteMany();
  await prisma.skill.createMany({ data: safeSkills });

  await prisma.timelineEvent.deleteMany();
  await prisma.timelineEvent.createMany({ data: safeTimeline });

  await prisma.certification.deleteMany();
  await prisma.certification.createMany({ data: safeCertifications });

  for (const document of safePortfolioDocuments) {
    await prisma.portfolioDocument.upsert({
      where: { kind: document.kind },
      update: {
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        versionLabel: document.versionLabel,
        visibility: "PUBLISHED",
        publishedAt: document.publishedAt ? new Date(document.publishedAt) : new Date()
      },
      create: {
        kind: document.kind,
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        versionLabel: document.versionLabel,
        visibility: "PUBLISHED",
        publishedAt: document.publishedAt ? new Date(document.publishedAt) : new Date()
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
