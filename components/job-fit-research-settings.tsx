"use client";

import { KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type Credential = { provider: "TAVILY" | "SCRAPE_DO"; keyHint: string; enabled: boolean; updatedAt: string };
const labels = { TAVILY: "Tavily research", SCRAPE_DO: "Scrape.do page extraction" } as const;

export function JobFitResearchSettings() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [message, setMessage] = useState("Loading research key settings...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/job-fit-credentials")
      .then((response) => readApiResponse<{ credentials: Credential[] }>(response))
      .then((value) => { if (active) { setCredentials(value.credentials); setMessage(""); } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Research settings could not be loaded."); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>, provider: Credential["provider"]) {
    event.preventDefault(); const element = event.currentTarget; const form = new FormData(element); const key = String(form.get("key") ?? "").trim();
    if (!key) return; setBusy(true); setMessage("Saving encrypted research key...");
    try { const value = await readApiResponse<{ credentials: Credential[] }>(await fetch("/api/admin/job-fit-credentials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, key }) })); setCredentials(value.credentials); element.reset(); setMessage(`${labels[provider]} key saved.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Research key could not be saved."); }
    finally { setBusy(false); }
  }
  async function remove(provider: Credential["provider"]) {
    setBusy(true); setMessage("Removing saved key...");
    try { const value = await readApiResponse<{ credentials: Credential[] }>(await fetch("/api/admin/job-fit-credentials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider }) })); setCredentials(value.credentials); setMessage(`${labels[provider]} key removed.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Research key could not be removed."); }
    finally { setBusy(false); }
  }

  return <section className="surface mt-8 rounded-xl p-5 sm:p-6" aria-labelledby="job-fit-research-settings"><div className="flex items-start gap-3"><KeyRound aria-hidden className="mt-0.5 h-5 w-5 text-cobalt-500" /><div><p className="eyebrow">Job Fit research</p><h2 id="job-fit-research-settings" className="mt-2 text-xl font-semibold">Source-backed market research</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Tavily finds role and company sources. Scrape.do extracts cited official pages. Values are encrypted at rest and never shown again.</p></div></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{(Object.keys(labels) as Credential["provider"][]).map((provider) => { const saved = credentials.find((credential) => credential.provider === provider); return <form key={provider} onSubmit={(event) => void save(event, provider)} className="rounded-lg border hairline bg-[var(--panel-strong)] p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{labels[provider]}</h3>{saved ? <button type="button" disabled={busy} onClick={() => void remove(provider)} className="inline-flex h-8 items-center gap-1.5 rounded-md border hairline px-2 text-xs hover:border-rose-500 hover:text-rose-600"><Trash2 aria-hidden className="h-3.5 w-3.5" /> Remove</button> : null}</div><p className="mt-1 text-xs text-[var(--muted)]">{saved ? `Saved key ending ${saved.keyHint}` : "No saved key. Environment fallback remains private."}</p><label className="mt-4 block"><span className="sr-only">{labels[provider]} API key</span><input name="key" type="password" autoComplete="off" placeholder={saved ? "Replace key" : "Paste API key"} className="h-10 w-full rounded-md border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-cobalt-500" /></label><button disabled={busy} type="submit" className="mt-3 inline-flex h-10 items-center rounded-md bg-ink-900 px-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950">{saved ? "Replace encrypted key" : "Save encrypted key"}</button></form>; })}</div><p className="mt-4 text-sm text-[var(--muted)]" aria-live="polite">{message}</p></section>;
}
