import { prisma } from "../lib/prisma";

const FILE_URL_PATTERN = /\/api\/files\/([a-zA-Z0-9_-]+)/g;

function collectFileIds(value: unknown, referenced: Set<string>) {
  if (typeof value !== "string") return;
  for (const match of value.matchAll(FILE_URL_PATTERN)) {
    referenced.add(match[1]);
  }
}

async function cleanup() {
  const referenced = new Set<string>();
  const [
    projects,
    caseStudies,
    experiments,
    blogs,
    dashboards,
    documents,
    profile,
  ] = await Promise.all([
    prisma.project.findMany(),
    prisma.caseStudy.findMany(),
    prisma.experiment.findMany(),
    prisma.blog.findMany(),
    prisma.dashboard.findMany(),
    prisma.portfolioDocument.findMany(),
    prisma.siteProfile.findUnique({ where: { id: "main" } }),
  ]);

  for (const record of [
    ...projects,
    ...caseStudies,
    ...experiments,
    ...blogs,
    ...dashboards,
    ...documents,
    ...(profile ? [profile] : []),
  ]) {
    for (const value of Object.values(record)) collectFileIds(value, referenced);
  }

  const storedFiles = await prisma.storedFile.findMany({ select: { id: true } });
  const unusedIds = storedFiles
    .map((file) => file.id)
    .filter((id) => !referenced.has(id));
  const deleted = unusedIds.length
    ? await prisma.storedFile.deleteMany({ where: { id: { in: unusedIds } } })
    : { count: 0 };

  console.log(
    JSON.stringify(
      {
        referencedDatabaseFiles: referenced.size,
        unusedDatabaseFilesDeleted: deleted.count,
      },
      null,
      2,
    ),
  );
}

cleanup()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
