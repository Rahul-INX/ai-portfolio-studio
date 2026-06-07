export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-sage-700 dark:text-sage-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-normal text-[var(--foreground)] sm:text-3xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
        {description}
      </p>
    </div>
  );
}
