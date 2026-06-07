import type { SkillSignal } from "@/lib/types";

export function KnowledgeGraph({ skills }: { skills: SkillSignal[] }) {
  const categories = Array.from(new Set(skills.map((skill) => skill.category)));
  return (
    <div className="surface quiet-grid relative overflow-hidden rounded-lg p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
            Knowledge Graph
          </p>
          <h3 className="mt-2 text-lg font-semibold">Applied AI capability map</h3>
        </div>
        <span className="rounded-md border hairline px-3 py-1 font-mono text-xs text-[var(--muted)]">
          {skills.length} nodes
        </span>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="rounded-md border hairline bg-[var(--panel)] px-3 py-2 text-sm">
              {category}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="rounded-md border hairline bg-[color-mix(in_srgb,var(--panel-strong),transparent_8%)] p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{skill.name}</p>
                <span className="font-mono text-xs text-cobalt-500">{skill.level}</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[color-mix(in_srgb,var(--foreground),transparent_90%)]">
                <div
                  className="h-full rounded-full bg-sage-500"
                  style={{ width: `${skill.level}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{skill.category}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
