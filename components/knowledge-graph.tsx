import type { SkillSignal } from "@/lib/types";
import { ContextualEditLink } from "@/components/contextual-edit-link";

export function KnowledgeGraph({ skills }: { skills: SkillSignal[] }) {
  const categories = Array.from(new Set(skills.map((skill) => skill.category)));
  return (
    <div className="surface relative overflow-hidden rounded-lg p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Capability index</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Capabilities, grouped by practice.</h3>
        </div>
        <span className="rounded-md border hairline px-3 py-1 font-mono text-xs text-[var(--muted)]">
          {skills.length} nodes
        </span>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {categories.map((category) => (
          <section key={category} className="rounded-xl border hairline bg-[var(--panel-strong)] p-5">
            <h4 className="text-sm font-semibold">{category}</h4>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {skills.filter((skill) => skill.category === category).map((skill) => (
                <div key={skill.name} className="flex items-center justify-between gap-3 rounded-md border hairline bg-[var(--panel)] px-3 py-2">
                  <p className="text-sm font-medium">{skill.name}</p>
                  <ContextualEditLink kind="skill" record={skill.name} label={skill.name} />
                </div>
              ))}
            </div>
          </section>
        ))}
        </div>
    </div>
  );
}
