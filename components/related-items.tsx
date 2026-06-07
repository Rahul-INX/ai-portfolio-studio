import Link from "next/link";
import type { ExplorerItem } from "@/lib/types";

export function RelatedItems({ items }: { items: ExplorerItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">Related Items</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={`${item.kind}-${item.slug}`}
            href={`/${item.kind}/${item.slug}`}
            className="surface rounded-lg p-4 transition hover:border-cobalt-500"
          >
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{item.kind}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
