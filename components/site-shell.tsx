import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { PortfolioAssistant } from "@/components/portfolio-assistant";
import { ThemeToggle } from "@/components/theme-toggle";
import { safeSiteProfile } from "@/lib/safe-content";
import type { SiteProfile } from "@/lib/types";

const nav = [
  { href: "/timeline#resume-downloads", label: "Resume" },
  { href: "/explorer", label: "Explorer" },
  { href: "/timeline", label: "Timeline" },
  { href: "/job-fit", label: "Check Job Fit", shortLabel: "Job Fit" },
  { href: "/admin", label: "Admin" }
];

function telHref(phone?: string | null) {
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;
}

export function SiteShell({ children, profile = safeSiteProfile }: { children: React.ReactNode; profile?: SiteProfile }) {
  const contactItems = [
    profile.contactEmail ? { label: profile.contactEmail, href: `mailto:${profile.contactEmail}`, icon: Mail } : null,
    profile.contactPhone ? { label: profile.contactPhone, href: telHref(profile.contactPhone), icon: Phone } : null,
    profile.contactLocation ? { label: profile.contactLocation, href: undefined, icon: MapPin } : null
  ].filter(Boolean) as Array<{ label: string; href?: string; icon: typeof Mail }>;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--panel-strong)] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b hairline bg-[color-mix(in_srgb,var(--background),transparent_10%)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
          <Link href="/" className="group inline-flex min-w-0 items-center gap-3" aria-label="Home">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-ink-900 text-sm font-semibold text-ink-50 dark:bg-ink-50 dark:text-ink-900">
              {profile.profileImageUrl ? (
                <Image
                  src={profile.profileImageUrl}
                  alt={`${profile.name} portrait`}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center">{profile.initials}</span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-normal">{profile.name}</span>
              <span className="hidden truncate text-xs text-[var(--muted)] sm:block">{profile.role}</span>
            </span>
          </Link>
          {contactItems.length ? (
            <div className="order-3 grid w-full grid-cols-1 gap-1 text-xs text-[var(--muted)] sm:grid-cols-2 lg:order-2 lg:flex lg:w-auto lg:max-w-[34rem] lg:flex-wrap lg:justify-center">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-cobalt-500" />
                    <span className="truncate">{item.label}</span>
                  </>
                );
                const className =
                  "inline-flex min-w-0 items-center gap-1.5 rounded-md border hairline bg-[var(--panel)] px-2.5 py-1.5 transition hover:border-cobalt-500";
                return item.href ? (
                  <a key={item.label} href={item.href} className={className}>
                    {content}
                  </a>
                ) : (
                  <span key={item.label} className={className}>
                    {content}
                  </span>
                );
              })}
            </div>
          ) : null}
          <nav aria-label="Primary navigation" className="order-2 flex max-w-full items-center gap-1 overflow-x-auto lg:order-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="rounded-md px-2 py-2 text-xs text-[color-mix(in_srgb,var(--foreground),transparent_22%)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] sm:px-3 sm:text-sm"
              >
                {"shortLabel" in item ? (
                  <>
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                ) : (
                  item.label
                )}
              </Link>
            ))}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main id="main">{children}</main>
      <PortfolioAssistant />
    </div>
  );
}
