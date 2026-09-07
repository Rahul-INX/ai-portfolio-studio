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
          <Link href="#selected-systems" className="group bg-[var(--panel-strong)] p-4 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">01 · Proof</p>
            <p className="mt-2 text-sm font-semibold">Review selected systems</p>
            <ArrowRight aria-hidden className="mt-4 h-4 w-4 text-[var(--accent)] transition group-hover:translate-x-1" />
          </Link>
          <Link href="/timeline#resume-downloads" className="group bg-[var(--panel-strong)] p-4 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">02 · Context</p>
            <p className="mt-2 text-sm font-semibold">Open resume and CV</p>
            <FileText aria-hidden className="mt-4 h-4 w-4 text-[var(--accent)]" />
          </Link>
          <a aria-label="Email Rahul" href={profile.contactEmail ? `mailto:${profile.contactEmail}` : "/timeline"} className="group bg-[var(--panel-strong)] p-4 transition hover:bg-[color-mix(in_srgb,var(--accent),transparent_92%)]">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">03 · Contact</p>
            <p className="mt-2 text-sm font-semibold">Start a conversation</p>
            <Mail aria-hidden className="mt-4 h-4 w-4 text-[var(--accent)]" />
          </a>
        </div>
      </div>
    </section>
  );
}
