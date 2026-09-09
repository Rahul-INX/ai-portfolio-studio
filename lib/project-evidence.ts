export function projectProof(project: { githubUrl?: string | null; demoUrl?: string | null }) {
  if (project.demoUrl && project.githubUrl) return { label: "Live demo + public repo", tone: "strong" as const };
  if (project.demoUrl) return { label: "Live demo", tone: "strong" as const };
  if (project.githubUrl) return { label: "Public repo", tone: "strong" as const };
  return { label: "No public repo or demo", tone: "limited" as const };
}
