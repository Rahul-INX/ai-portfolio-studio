"use client";

import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";
import type { JobFitIntelligenceResult } from "@/lib/job-fit-intelligence";

type Inquiry = { id: string; company: string | null; role: string | null; location: string | null; status: string; createdAt: string; publicApprovedAt: string | null };
type State = { total: number; completed: number; inquiries: Inquiry[] };
type Detail = {
  id: string;
  jdText: string | null;
  fileName: string | null;
  coreResult: JobFitIntelligenceResult | null;
  events: Array<{ id: string; stage: string; status: string; detail: string }>;
  chats: Array<{ id: string; role: string; content: string }>;
};

export function JobFitInquiryReview() {
  const [state, setState] = useState<State | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("Loading retained Job Fit inquiries...");

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/job-fit-inquiries")
      .then((response) => readApiResponse<State>(response))
      .then((value) => { if (active) { setState(value); setMessage(""); } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Job Fit inquiries could not be loaded."); });
    return () => { active = false; };
  }, []);

  async function inspect(item: Inquiry) {
    setDetail(null);
    setMessage("Loading the retained JD and assessment...");
    try {
      const value = await readApiResponse<{ inquiry: Detail }>(await fetch(`/api/admin/job-fit-inquiries/${encodeURIComponent(item.id)}`));
      setDetail(value.inquiry);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Job Fit inquiry details could not be loaded.");
    }
  }

  async function setPublic(item: Inquiry, publicApproved: boolean) {
    try {
      const value = await readApiResponse<{ inquiry: { publicApprovedAt: string | null } }>(await fetch(`/api/admin/job-fit-inquiries/${encodeURIComponent(item.id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ publicApproved }) }));
      setState((current) => current ? { ...current, inquiries: current.inquiries.map((candidate) => candidate.id === item.id ? { ...candidate, publicApprovedAt: value.inquiry.publicApprovedAt } : candidate) } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Activity visibility could not be updated.");
    }
  }

  return <section className="surface mt-8 rounded-xl p-5 sm:p-6" aria-labelledby="job-fit-inquiry-review">
    <div className="flex items-start gap-3"><ClipboardList aria-hidden className="mt-0.5 h-5 w-5 text-cobalt-500" /><div><p className="eyebrow">Job Fit review</p><h2 id="job-fit-inquiry-review" className="mt-2 text-xl font-semibold">Inquiry ledger</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Private browser-session-scoped inquiries retained for one year unless pinned. Approving a role pill never exposes a company name.</p></div></div>
    {state ? <><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border hairline bg-[var(--panel-strong)] p-4"><p className="eyebrow">Total inquiries</p><p className="mt-2 text-2xl font-semibold">{state.total}</p></div><div className="rounded-lg border hairline bg-[var(--panel-strong)] p-4"><p className="eyebrow">Completed research</p><p className="mt-2 text-2xl font-semibold">{state.completed}</p></div></div><div className="mt-5 divide-y divide-[var(--line)] overflow-hidden rounded-lg border hairline">{state.inquiries.length ? state.inquiries.map((item) => <article key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"><div><p className="text-sm font-semibold">{item.role ?? "Role not identified"}{item.company ? ` · ${item.company}` : ""}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.location ?? "Location not identified"} · {new Date(item.createdAt).toLocaleString()}</p></div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{item.status.replace(/_/g, " ")}</span><button type="button" onClick={() => void inspect(item)} className="rounded-md border hairline px-2 py-1 text-xs font-medium hover:border-cobalt-500">View assessment</button><button type="button" onClick={() => void setPublic(item, !item.publicApprovedAt)} className="rounded-md border hairline px-2 py-1 text-xs font-medium hover:border-cobalt-500">{item.publicApprovedAt ? "Hide activity" : "Approve role pill"}</button></article>) : <p className="p-4 text-sm text-[var(--muted)]">No retained Job Fit inquiries yet.</p>}</div></> : null}
    {detail ? <section className="mt-5 rounded-lg border hairline bg-[var(--panel-strong)] p-4" aria-labelledby="job-fit-assessment-detail"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Private admin review</p><h3 id="job-fit-assessment-detail" className="mt-1 text-lg font-semibold">Review JD and output</h3></div><button type="button" onClick={() => setDetail(null)} className="rounded-md border hairline px-2 py-1 text-xs font-medium">Close</button></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Original JD{detail.fileName ? ` · ${detail.fileName}` : ""}</p><pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border hairline bg-[var(--panel)] p-3 text-xs leading-5">{detail.jdText ?? "The retained JD could not be decrypted."}</pre></div><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Saved assessment</p><p className="mt-2 text-sm leading-6">{detail.coreResult?.summary ?? "No saved assessment output."}</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><p className="rounded-md border hairline p-2">Fit: <strong>{detail.coreResult?.scoring.fitScore ?? "—"}</strong></p><p className="rounded-md border hairline p-2">Evidence: <strong>{detail.coreResult ? `${detail.coreResult.scoring.evidenceConfidence}%` : "—"}</strong></p></div><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Research: {detail.coreResult?.research.note ?? "Not available."}</p>{detail.coreResult?.research.citations.length ? <ul className="mt-2 space-y-1 text-xs">{detail.coreResult.research.citations.map((citation) => <li key={citation.url}><a href={citation.url} target="_blank" rel="noreferrer" className="text-cobalt-600 hover:underline dark:text-cobalt-300">{citation.title}</a></li>)}</ul> : null}</div></div><details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Requirements and evidence ({detail.coreResult?.requirementEvidence.length ?? 0})</summary><ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">{detail.coreResult?.requirementEvidence.map((requirement) => <li key={requirement.requirement}>{requirement.requirement} · {requirement.evidence.length} cited source{requirement.evidence.length === 1 ? "" : "s"}</li>)}</ul></details><details className="mt-3"><summary className="cursor-pointer text-sm font-medium">Progress and chat ({detail.events.length + detail.chats.length})</summary><ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">{detail.events.map((event) => <li key={event.id}>{event.stage}: {event.detail}</li>)}{detail.chats.map((chat) => <li key={chat.id}>{chat.role}: {chat.content}</li>)}</ul></details></section> : null}
    {message ? <p className="mt-5 text-sm text-[var(--muted)]" aria-live="polite">{message}</p> : null}
  </section>;
}
