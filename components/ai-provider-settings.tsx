"use client";

import { Check, ChevronDown, KeyRound, Plus, RefreshCw, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { readApiResponse } from "@/lib/api-response";

type ProviderName = "GEMINI" | "OPENAI" | "ANTHROPIC" | "XAI";
type ProviderKey = { id: string; label: string; keyHint: string; enabled: boolean; priority: number; lastTestedAt: string | null; lastTestStatus: string | null };
type Provider = { provider: ProviderName; enabled: boolean; priority: number; selectedModel: string | null; maxOutputTokens: number; dailyRequestLimit: number; keys: ProviderKey[] };
type ProviderState = { providers: Provider[] };
type ModelState = Record<string, Array<{ id: string; label: string }>>;

const labels: Record<ProviderName, string> = { GEMINI: "Gemini", OPENAI: "OpenAI", ANTHROPIC: "Claude", XAI: "Grok" };

export function AiProviderSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<ModelState>({});
  const [adding, setAdding] = useState<ProviderName | null>(null);
  const [message, setMessage] = useState("Loading your AI setup...");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void request("/api/admin/ai-providers").then((payload) => { if (payload) { setProviders(payload.providers); setMessage(""); } }); }, []);

  async function request(url: string, init?: RequestInit) {
    try { return await readApiResponse<ProviderState>(await fetch(url, init)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "AI settings could not be loaded."); return null; }
  }

  async function mutate(body: object, success: string) {
    setBusy(true); setMessage("Saving your AI setup...");
    const payload = await request("/api/admin/ai-providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (payload) { setProviders(payload.providers); setMessage(success); }
    setBusy(false); return payload;
  }

  async function discover(provider: Provider) {
    setBusy(true); setMessage(`Checking which ${labels[provider.provider]} models this key can use...`);
    try {
      const payload = await readApiResponse<{ models: Array<{ id: string; label: string }> }>(await fetch("/api/admin/ai-providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "discover-models", provider: provider.provider }) }));
      setModels((current) => ({ ...current, [provider.provider]: payload.models })); setMessage(`${payload.models.length} available ${labels[provider.provider]} models found.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Models could not be loaded."); }
    finally { setBusy(false); }
  }

  async function addKey(event: React.FormEvent<HTMLFormElement>, provider: ProviderName) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const payload = await mutate({ action: "add-key", provider, label: data.get("label"), key: data.get("key") }, `${labels[provider]} key added securely.`);
    if (payload) { event.currentTarget.reset(); setAdding(null); }
  }

  function providerData(provider: Provider, data: FormData) {
    return { action: "update-provider", provider: provider.provider, enabled: data.get("enabled") === "on", priority: provider.priority, selectedModel: data.get("model"), maxOutputTokens: Number(data.get("maxOutputTokens")), dailyRequestLimit: Number(data.get("dailyRequestLimit")) };
  }

  async function saveProvider(event: React.FormEvent<HTMLFormElement>, provider: Provider) {
    event.preventDefault(); await mutate(providerData(provider, new FormData(event.currentTarget)), `${labels[provider.provider]} settings saved.`);
  }

  async function makePrimary(provider: Provider) {
    const ordered = [provider, ...providers.filter((item) => item.provider !== provider.provider)];
    setBusy(true); setMessage(`Making ${labels[provider.provider]} your primary provider...`);
    for (const [priority, item] of ordered.entries()) {
      await request("/api/admin/ai-providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update-provider", provider: item.provider, enabled: item.enabled, priority, selectedModel: item.selectedModel ?? "", maxOutputTokens: item.maxOutputTokens, dailyRequestLimit: item.dailyRequestLimit }) });
    }
    const payload = await request("/api/admin/ai-providers");
    if (payload) { setProviders(payload.providers); setMessage(`${labels[provider.provider]} is now first in line.`); }
    setBusy(false);
  }

  async function saveKey(event: React.FormEvent<HTMLFormElement>, key: ProviderKey) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await mutate({ action: "update-key", id: key.id, label: data.get("label"), enabled: data.get("enabled") === "on", priority: key.priority }, "Key settings saved.");
  }

  async function revokeKey(key: ProviderKey) {
    if (!window.confirm(`Remove ${key.label}? You cannot recover this saved key.`)) return;
    setBusy(true); setMessage("Removing saved key...");
    const payload = await request("/api/admin/ai-providers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: key.id }) });
    if (payload) { setProviders(payload.providers); setMessage("Saved key removed."); }
    setBusy(false);
  }

  async function testKey(key: ProviderKey) {
    setBusy(true); setMessage(`Testing ${key.label}...`);
    try { const payload = await readApiResponse<ProviderState>(await fetch("/api/admin/ai-providers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test-key", id: key.id }) })); if (payload.providers.length) setProviders(payload.providers); setMessage(`${key.label} works.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "This key could not be tested."); }
    finally { setBusy(false); }
  }

  const active = providers.filter((provider) => provider.enabled);
  const keyCount = providers.reduce((total, provider) => total + provider.keys.filter((key) => key.enabled).length, 0);

  return (
    <section className="mt-10" aria-labelledby="ai-provider-heading">
      <div className="surface overflow-hidden rounded-xl">
        <div className="border-b hairline bg-[color-mix(in_srgb,var(--accent),transparent_95%)] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><p className="eyebrow">AI connection desk</p><h2 id="ai-provider-heading" className="mt-2 text-2xl font-semibold">Choose how your AI features should run</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Add a provider key once. We keep it encrypted, use your first available provider, and move to the next enabled key if the first one is unavailable.</p></div><div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--panel-strong)] px-3 py-2 text-xs font-semibold"><ShieldCheck aria-hidden className="h-4 w-4 text-[var(--accent)]" /> Encrypted on the server</div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3"><Summary label="Primary route" value={active[0] ? labels[active[0].provider] : "Not set"} detail={active[0] ? "First provider tried" : "Add a key below"} /><Summary label="Backup route" value={`${Math.max(active.length - 1, 0)} available`} detail="Enabled providers after primary" /><Summary label="Working keys" value={`${keyCount}`} detail="Encrypted keys available" /></div>
        </div>
        <div className="border-b hairline p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">Simple setup</p><h3 className="mt-2 text-xl font-semibold">1. Add a key · 2. Pick a model · 3. Keep a backup</h3></div><p className="text-sm text-[var(--muted)]" aria-live="polite">{message}</p></div><div className="mt-5 grid gap-4 xl:grid-cols-2">{providers.map((provider) => <ProviderCard key={provider.provider} provider={provider} rank={provider.enabled ? active.findIndex((item) => item.provider === provider.provider) : -1} models={models[provider.provider] ?? []} adding={adding === provider.provider} busy={busy} onAdd={() => setAdding(provider.provider)} onCancelAdd={() => setAdding(null)} onDiscover={() => void discover(provider)} onPrimary={() => void makePrimary(provider)} onSaveProvider={(event) => void saveProvider(event, provider)} onAddKey={(event) => void addKey(event, provider.provider)} onSaveKey={(event, key) => void saveKey(event, key)} onTestKey={(key) => void testKey(key)} onRevokeKey={(key) => void revokeKey(key)} />)}</div></div>
        <div className="bg-[var(--panel-strong)] px-5 py-4 text-xs leading-5 text-[var(--muted)] sm:px-7"><strong className="text-[var(--foreground)]">Good to know:</strong> you do not need to understand priorities, token limits, or API internals. The defaults are suitable for this portfolio. Open “Advanced controls” only when you have a specific reason.</div>
      </div>
    </section>
  );
}

function ProviderCard({ provider, rank, models, adding, busy, onAdd, onCancelAdd, onDiscover, onPrimary, onSaveProvider, onAddKey, onSaveKey, onTestKey, onRevokeKey }: { provider: Provider; rank: number; models: Array<{ id: string; label: string }>; adding: boolean; busy: boolean; onAdd: () => void; onCancelAdd: () => void; onDiscover: () => void; onPrimary: () => void; onSaveProvider: (event: React.FormEvent<HTMLFormElement>) => void; onAddKey: (event: React.FormEvent<HTMLFormElement>) => void; onSaveKey: (event: React.FormEvent<HTMLFormElement>, key: ProviderKey) => void; onTestKey: (key: ProviderKey) => void; onRevokeKey: (key: ProviderKey) => void }) {
  const name = labels[provider.provider];
  const modelOptions = provider.selectedModel && !models.some((model) => model.id === provider.selectedModel) ? [{ id: provider.selectedModel, label: provider.selectedModel }, ...models] : models;
  return <article className={`rounded-lg border p-4 sm:p-5 ${provider.enabled ? "border-[var(--accent)]/40 bg-[color-mix(in_srgb,var(--accent),transparent_96%)]" : "hairline bg-[var(--panel)] opacity-80"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--surface-support)] font-mono text-sm font-bold">{rank >= 0 ? rank + 1 : "—"}</span><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-semibold">{name}</h4>{provider.enabled ? <span className="rounded-full bg-[var(--accent)]/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">{rank === 0 ? "Primary" : "Backup"}</span> : <span className="rounded-full border hairline px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Off</span>}</div><p className="mt-1 text-sm text-[var(--muted)]">{provider.keys.length ? `${provider.keys.length} saved key${provider.keys.length === 1 ? "" : "s"}` : "No key connected yet"} · {provider.selectedModel || "Choose a model"}</p></div></div>{provider.enabled && rank > 0 ? <button type="button" disabled={busy} onClick={onPrimary} className="min-h-10 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50">Make primary</button> : null}</div><div className="mt-5 rounded-md border hairline bg-[var(--panel-strong)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Connection keys</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Use multiple keys for resilience. They are never displayed after saving.</p></div><button type="button" disabled={busy} onClick={adding ? onCancelAdd : onAdd} className="inline-flex min-h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50">{adding ? <><X aria-hidden className="h-4 w-4" /> Close</> : <><Plus aria-hidden className="h-4 w-4" /> Add key</>}</button></div>{provider.keys.length ? <div className="mt-4 space-y-2">{provider.keys.map((key) => <KeyRow key={key.id} keyData={key} busy={busy} onSave={onSaveKey} onTest={onTestKey} onRevoke={onRevokeKey} />)}</div> : <p className="mt-4 rounded-md border border-dashed hairline p-3 text-sm text-[var(--muted)]">Add one key to make {name} available.</p>}{adding ? <form onSubmit={onAddKey} className="mt-4 grid gap-3 rounded-md border border-[var(--accent)]/30 bg-[var(--panel)] p-4 sm:grid-cols-[1fr_1.4fr_auto]"><label><span className="text-sm font-semibold">Name this key</span><input name="label" required minLength={2} maxLength={80} placeholder="Personal key" className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label><label><span className="text-sm font-semibold">Paste API key</span><input name="key" type="password" required minLength={8} autoComplete="off" className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label><button type="submit" disabled={busy} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] disabled:opacity-50"><KeyRound aria-hidden className="h-4 w-4" /> Save key</button></form> : null}</div><details className="mt-4 rounded-md border hairline"><summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">Model and usage controls <ChevronDown aria-hidden className="h-4 w-4 text-[var(--muted)]" /></summary><form onSubmit={onSaveProvider} className="grid gap-4 border-t hairline p-4 sm:grid-cols-2"><label className="flex min-h-11 items-center gap-3 rounded-md border hairline px-3"><input name="enabled" type="checkbox" defaultChecked={provider.enabled} className="h-4 w-4 accent-cobalt-600" /><span className="text-sm font-semibold">Use {name}</span></label><label><span className="text-sm font-semibold">Model</span>{modelOptions.length ? <select name="model" aria-label={`Model for ${name}`} defaultValue={provider.selectedModel ?? ""} className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3">{modelOptions.map((model) => <option key={model.id} value={model.id}>{model.label}</option>)}</select> : <input name="model" aria-label={`Model for ${name}`} defaultValue={provider.selectedModel ?? ""} required className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3" />}</label><div className="sm:col-span-2"><button type="button" disabled={busy} onClick={onDiscover} className="inline-flex min-h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50"><RefreshCw aria-hidden className="h-4 w-4" /> Refresh available models</button><p className="mt-2 text-xs leading-5 text-[var(--muted)]">This checks the connected key and only shows models that key can use.</p></div><label><span className="text-xs text-[var(--muted)]">Response length limit</span><input type="number" name="maxOutputTokens" defaultValue={provider.maxOutputTokens} min={100} max={8192} required className="mt-1 h-10 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label><label><span className="text-xs text-[var(--muted)]">Daily request safety limit</span><input type="number" name="dailyRequestLimit" defaultValue={provider.dailyRequestLimit} min={1} max={10000} required className="mt-1 h-10 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label><button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--background)] disabled:opacity-50 sm:col-span-2"><Save aria-hidden className="h-4 w-4" /> Save advanced controls</button></form></details></article>;
}

function KeyRow({ keyData, busy, onSave, onTest, onRevoke }: { keyData: ProviderKey; busy: boolean; onSave: (event: React.FormEvent<HTMLFormElement>, key: ProviderKey) => void; onTest: (key: ProviderKey) => void; onRevoke: (key: ProviderKey) => void }) {
  return <form role="group" aria-label={keyData.label} onSubmit={(event) => onSave(event, keyData)} className="rounded-md border hairline bg-[var(--panel)] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">{keyData.label}</p><p className="mt-1 font-mono text-xs text-[var(--muted)]">Encrypted key · ••••{keyData.keyHint}</p></div><span className={`text-xs font-semibold ${keyData.lastTestStatus === "PASS" ? "text-[var(--accent)]" : keyData.lastTestStatus === "FAIL" ? "text-red-500" : "text-[var(--muted)]"}`}>{keyData.lastTestStatus === "PASS" ? <><Check aria-hidden className="mr-1 inline h-3.5 w-3.5" />Working</> : keyData.lastTestStatus === "FAIL" ? "Needs attention" : "Not tested"}</span></div><details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--muted)]">Edit key settings <ChevronDown aria-hidden className="ml-1 inline h-3.5 w-3.5" /></summary><div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]"><label><span className="text-xs text-[var(--muted)]">Key name</span><input name="label" defaultValue={keyData.label} required className="mt-1 h-10 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label><label className="flex min-h-10 items-end gap-2 pb-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={keyData.enabled} className="h-4 w-4 accent-cobalt-600" /> Use this key</label></div></details><div className="mt-3 flex flex-wrap gap-2"><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50"><Save aria-hidden className="h-4 w-4" /> Save changes</button><button type="button" disabled={busy} onClick={() => onTest(keyData)} className="inline-flex min-h-10 items-center gap-2 rounded-md border hairline px-3 text-sm font-semibold hover:border-[var(--accent)] disabled:opacity-50"><RefreshCw aria-hidden className="h-4 w-4" /> Test key</button><button type="button" disabled={busy} onClick={() => onRevoke(keyData)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"><Trash2 aria-hidden className="h-4 w-4" /> Remove</button></div></form>;
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="rounded-md border hairline bg-[var(--panel-strong)] p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{detail}</p></div>; }
