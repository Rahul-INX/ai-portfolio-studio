import Link from "next/link";
import { ArrowRight, FileText, Mail } from "lucide-react";
import type { SiteProfile } from "@/lib/types";

export function RecruiterBrief({ profile }: { profile: SiteProfile }) {
  return (
    <section className="border-b hairline bg-[var(--panel)]" aria-labelledby="recruiter-brief-title">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div>
          <p className="eyebrow">Recruiter essentials</p>
          <h2 id="recruiter-brief-title" className="mt-3 text-2xl font-semibold tracking-[-0.02em]">Evaluate the work in minutes.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Start with selected systems, then use the resume and direct contact route. The rest of the portfolio is supporting evidence—not a maze.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-xl border hairline bg-[var(--line)] sm:grid-cols-3">
          <Link href="#selected-systems" className="group bg-[var(--panel-strong)] p-5 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)] focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">01 · Proof</p>
              <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-[var(--accent)] transition group-hover:translate-x-1" />
            </div>
            <p className="mt-4 max-w-[15rem] text-base font-semibold leading-6 sm:text-lg">Review selected systems</p>
          </Link>
          <Link href="/timeline#resume-downloads" className="group bg-[var(--panel-strong)] p-5 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)] focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">02 · Context</p>
              <FileText aria-hidden className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            </div>
            <p className="mt-4 text-base font-semibold leading-6 sm:text-lg">Open resume and CV</p>
          </Link>
          <a aria-label="Email Rahul" href={profile.contactEmail ? `mailto:${profile.contactEmail}` : "/timeline"} className="group bg-[var(--panel-strong)] p-5 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)] focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">03 · Contact</p>
              <Mail aria-hidden className="h-5 w-5 shrink-0 text-[var(--accent)]" />
            </div>
            <p className="mt-4 text-base font-semibold leading-6 sm:text-lg">Start a conversation</p>
          </a>
        </div>
      </div>
    </section>
  );
}
