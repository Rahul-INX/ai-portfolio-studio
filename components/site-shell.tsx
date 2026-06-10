import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, MapPin, Settings, Phone } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { PortfolioAssistant } from "@/components/portfolio-assistant";
import { GitHubIcon, LinkedInIcon } from "@/components/social-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavigationFeedback } from "@/components/navigation-feedback";
import { EditModeProvider } from "@/components/edit-mode-provider";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeSiteProfile } from "@/lib/safe-content";
import type { SiteProfile } from "@/lib/types";

function telHref(phone?: string | null) {
  return phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;
}

export async function SiteShell({ children, profile = safeSiteProfile }: { children: React.ReactNode; profile?: SiteProfile }) {
  const session = await getServerSession(authOptions);
  const nav = [
    { href: "/explorer", label: profile.navExplorerLabel || "Systems Explorer" },
    { href: "/timeline", label: profile.navExperienceLabel || "Experience" },
    { href: "/timeline#resume-downloads", label: profile.navResumeLabel || "Resume" },
    { href: "/job-fit", label: profile.navJobFitLabel || "Check Job Fit", shortLabel: "Job Fit" },
  ];
  const contactItems = [
    profile.contactEmail ? { label: profile.contactEmail, href: `mailto:${profile.contactEmail}`, icon: Mail } : null,
    profile.contactPhone ? { label: profile.contactPhone, href: telHref(profile.contactPhone), icon: Phone } : null,
    profile.contactLocation ? { label: profile.contactLocation, href: undefined, icon: MapPin } : null
  ].filter(Boolean) as Array<{ label: string; href?: string; icon: typeof Mail }>;
  const socialItems = [
    profile.githubUrl
      ? { label: "GitHub profile", href: profile.githubUrl, icon: GitHubIcon, colorClass: "" }
      : null,
    profile.linkedinUrl
      ? { label: "LinkedIn profile", href: profile.linkedinUrl, icon: LinkedInIcon, colorClass: "text-[#0A66C2]" }
      : null
  ].filter(Boolean) as Array<{ label: string; href: string; icon: typeof GitHubIcon; colorClass: string }>;

  return (
    <EditModeProvider authenticated={Boolean(session?.user?.id)}>
      <div className="min-h-screen">
      <NavigationFeedback />
      <a
        href="#main"
        tabIndex={0}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--panel-strong)] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b hairline bg-[color-mix(in_srgb,var(--background),transparent_6%)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[4rem] items-center justify-between gap-4 py-2.5">
            <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Home">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border hairline bg-ink-900 text-xs font-semibold text-ink-50 dark:bg-ink-50 dark:text-ink-900">
                {profile.profileImageUrl ? (
                  <Image
                    src={profile.profileImageUrl}
                    alt={`${profile.name} portrait`}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center">{profile.initials}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block max-w-[13rem] truncate text-sm font-semibold tracking-normal sm:max-w-xs sm:text-base">
                  {profile.name}
                </span>
                <span className="mt-0.5 block max-w-[13rem] truncate text-xs text-[var(--muted)] sm:max-w-xs">
                  {profile.role}
                </span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden items-center gap-1 sm:flex">
                {socialItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className={`grid h-9 w-9 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] ${item.colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
              <ThemeToggle />
              {session?.user ? (
                <>
                  <Link href="/admin" aria-label="Open portfolio admin" title="Admin" className="grid h-9 w-9 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)]">
                    <Settings aria-hidden className="h-4 w-4" />
                  </Link>
                  <AdminLogoutButton compact />
                </>
              ) : (
                <Link href="/admin/login" aria-label="Admin sign in" title="Admin sign in" className="grid h-9 w-9 place-items-center rounded-md text-[var(--muted)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)]">
                  <LogIn aria-hidden className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-4 border-t hairline">
            <nav
              aria-label="Primary navigation"
              className="-ml-2 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="shrink-0 rounded-md px-2.5 py-2 text-xs font-medium text-[color-mix(in_srgb,var(--foreground),transparent_26%)] transition hover:bg-[var(--panel)] hover:text-[var(--foreground)] sm:px-3 sm:text-sm"
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
              {session?.user ? (
                <Link
                  href="/admin"
                  className="shrink-0 rounded-md px-2.5 py-2 text-xs font-semibold text-cobalt-600 transition hover:bg-[var(--panel)] hover:text-cobalt-700 sm:px-3 sm:text-sm dark:text-cobalt-300 dark:hover:text-cobalt-200"
                >
                  {profile.adminCmsLabel || "Admin CMS"}
                </Link>
              ) : null}
            </nav>

            {contactItems.length ? (
              <div className="hidden min-w-0 items-center gap-4 text-xs text-[var(--muted)] xl:flex">
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <>
                      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-cobalt-500" />
                      <span className="max-w-[15rem] truncate">{item.label}</span>
                    </>
                  );
                  const className =
                    "inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap transition hover:text-[var(--foreground)]";
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
          </div>

          {contactItems.length ? (
            <div className="hidden min-w-0 gap-4 overflow-x-auto border-t hairline py-2 text-xs text-[var(--muted)] [scrollbar-width:none] md:flex xl:hidden [&::-webkit-scrollbar]:hidden">
              {socialItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex shrink-0 items-center gap-1.5 sm:hidden"
                  >
                    <Icon className={`h-3.5 w-3.5 ${item.colorClass}`} />
                    <span>{item.label.replace(" profile", "")}</span>
                  </a>
                );
              })}
              {contactItems.map((item) => {
                const Icon = item.icon;
                const content = (
                  <>
                    <Icon aria-hidden className="h-3.5 w-3.5 shrink-0 text-cobalt-500" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </>
                );
                const className = "inline-flex shrink-0 items-center gap-1.5";
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
        </div>
      </header>
      <main id="main">{children}</main>
      <PortfolioAssistant ownerName={profile.name} />
      </div>
    </EditModeProvider>
  );
}
