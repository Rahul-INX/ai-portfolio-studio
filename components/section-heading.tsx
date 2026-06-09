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
    <div className="grid max-w-5xl gap-4 md:grid-cols-[0.34fr_1fr] md:gap-8">
      <p className="eyebrow pt-1">{eyebrow}</p>
      <div>
      <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
        {description}
      </p>
      </div>
    </div>
  );
}
