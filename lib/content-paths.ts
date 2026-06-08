export type EditableContentKind =
  | "site-profile"
  | "project"
  | "case-study"
  | "experiment"
  | "blog"
  | "dashboard"
  | "skill"
  | "certification"
  | "timeline"
  | "document";

const aiReadablePaths = ["/llms.txt", "/llms-full.txt"];

export function affectedContentPaths(kind: EditableContentKind, slug?: string) {
  const paths =
    kind === "site-profile"
      ? ["/", "/explorer", "/timeline"]
      : kind === "project"
        ? ["/", "/explorer", slug ? `/project/${slug}` : undefined]
        : kind === "case-study"
          ? ["/", "/explorer", slug ? `/case-study/${slug}` : undefined]
          : kind === "experiment"
            ? ["/", "/explorer", slug ? `/experiment/${slug}` : undefined]
            : kind === "blog"
              ? ["/", "/explorer", slug ? `/blog/${slug}` : undefined]
              : kind === "dashboard"
                ? ["/", "/explorer", slug ? `/dashboard/${slug}` : undefined]
                : kind === "skill"
                  ? ["/"]
                  : ["/timeline"];

  return [...new Set([...paths.filter((path): path is string => Boolean(path)), ...aiReadablePaths])];
}
