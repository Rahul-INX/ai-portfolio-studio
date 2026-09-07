"use client";

import { CheckCircle2, Cloud, HardDriveUpload, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type State = { configured: boolean; connected: boolean; accountEmail: string | null; lastVerifiedAt: string | null; legacy: { count: number; size: number }; drive: { count: number; size: number } };

function size(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(0, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

export function GoogleDriveMediaSettings() {
  const [state, setState] = useState<State | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState("Loading media storage...");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try { const value = await readApiResponse<State>(await fetch("/api/admin/google-drive")); setState(value); setMessage(""); return value; }
    catch (error) { setMessage(error instanceof Error ? error.message : "Media storage could not be loaded."); return null; }
  }
  useEffect(() => { void refresh(); }, []);

  async function verify() {
    setBusy(true); setMessage("Checking your Google Drive connection...");
    try { const value = await readApiResponse<State>(await fetch("/api/admin/google-drive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify" }) })); setState(value); setMessage("Google Drive is ready for uploads."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Google Drive could not be verified."); }
    finally { setBusy(false); }
  }

  async function migrate() {
    if (!confirmed) return;
    setBusy(true); let current = state; let moved = 0; let removed = 0;
    try {
      while (current?.legacy.count) {
        setMessage(`Moving legacy media… ${current.legacy.count} Neon file${current.legacy.count === 1 ? "" : "s"} remaining.`);
        const result = await readApiResponse<{ migrated: number; removedUnused: number; remaining: number; failures: string[] }>(await fetch("/api/admin/google-drive/migrate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: true, limit: 10 }) }));
        moved += result.migrated; removed += result.removedUnused;
        if (result.failures.length) throw new Error(`Stopped before cleanup: ${result.failures.join(", ")} could not be moved.`);
        current = await refresh();
      }
      setMessage(`Migration complete. ${moved} media item${moved === 1 ? "" : "s"} moved to Drive; ${removed} unused Neon blob${removed === 1 ? "" : "s"} removed.`);
      setConfirmed(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Migration stopped. Existing files were left intact when their move failed."); }
    finally { setBusy(false); }
  }

  return <section className="surface mt-8 overflow-hidden rounded-xl" aria-labelledby="drive-media-heading"><div className="border-b hairline bg-[color-mix(in_srgb,var(--accent),transparent_95%)] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">Media storage</p><h2 id="drive-media-heading" className="mt-2 text-2xl font-semibold">Your portfolio media library</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Keep portfolio data in Neon and place images, PDFs, and documents in one private Google Drive library. Your CMS keeps working the same way.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--panel-strong)] px-3 py-2 text-xs font-semibold"><ShieldCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" /> Private Drive origin</span></div></div>{!state ? <p className="p-5 text-sm text-[var(--muted)]">{message}</p> : !state.configured ? <div className="p-5 sm:p-6"><div className="rounded-lg border border-dashed hairline bg-[var(--panel-strong)] p-5"><Cloud aria-hidden className="h-6 w-6 text-[var(--accent)]" /><h3 className="mt-4 text-lg font-semibold">One-time Google setup</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Google needs this portfolio to be registered once before it can show the account picker. Create a Web OAuth client, add <code>http://localhost:3000/api/admin/google-drive/callback</code> as its redirect address, then save its ID and secret in <code>.env.local</code>.</p><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)]"><Cloud aria-hidden className="h-4 w-4" /> Open Google setup</a><p className="mt-3 text-xs leading-5 text-[var(--muted)]">After the app restarts, this becomes “Connect Google Drive,” which opens Google’s choose-account and authorization screens.</p></div></div> : !state.connected ? <div className="p-5 sm:p-6"><div className="rounded-lg border border-dashed hairline bg-[var(--panel-strong)] p-5"><Cloud aria-hidden className="h-6 w-6 text-[var(--accent)]" /><h3 className="mt-4 text-lg font-semibold">Connect your Google Drive</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">We will create a clearly named “Portfolio Studio Media” folder with image and document sections. Existing Neon media stays untouched until you explicitly migrate it.</p><a href="/api/admin/google-drive/connect" className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)]"><Cloud aria-hidden className="h-4 w-4" /> Connect Google Drive</a></div>{message ? <p className="mt-4 text-sm text-[var(--muted)]">{message}</p> : null}</div> : <div className="p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-3"><Stat label="Connected account" value={state.accountEmail ?? "Google Drive"} /><Stat label="Drive media" value={`${state.drive.count} items · ${size(state.drive.size)}`} /><Stat label="Legacy Neon media" value={`${state.legacy.count} items · ${size(state.legacy.size)}`} /></div><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={() => void verify()} className="inline-flex h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50"><RefreshCw aria-hidden className="h-4 w-4" /> Verify connection</button><p aria-live="polite" className="text-sm text-[var(--muted)]">{message || "New uploads now go to Drive."}</p></div>{state.legacy.count ? <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4"><div className="flex gap-3"><TriangleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><h3 className="font-semibold">Migrate and clean legacy Neon media</h3><p className="mt-1 text-sm leading-6 text-[var(--muted)]">This copies every referenced database file to Drive, rewrites its CMS link, verifies the new asset, then deletes that individual Neon blob. Unused Neon blobs are removed instead of copied. A failed item stays in Neon.</p><label className="mt-4 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" /><span>I understand this cleans migrated files from Neon only after their Drive copy and CMS URL are written.</span></label><button type="button" disabled={!confirmed || busy} onClick={() => void migrate()} className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"><HardDriveUpload aria-hidden className="h-4 w-4" /> Migrate {state.legacy.count} legacy item{state.legacy.count === 1 ? "" : "s"}</button></div></div></div> : <div className="mt-6 flex items-center gap-3 rounded-lg border border-[var(--accent)]/30 bg-[color-mix(in_srgb,var(--accent),transparent_94%)] p-4 text-sm"><CheckCircle2 aria-hidden className="h-5 w-5 text-[var(--accent)]" /> Neon has no remaining stored media blobs.</div>}</div>}</section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-md border hairline bg-[var(--panel-strong)] p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p><p className="mt-2 break-words text-sm font-semibold">{value}</p></div>; }
