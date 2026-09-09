"use client";

import { Save, Settings2 } from "lucide-react";
import { useState } from "react";
import type { JobFitSettings } from "@/lib/job-fit-settings";

export function JobFitSettingsForm({ initialSettings }: { initialSettings: JobFitSettings }) {
  const [fallbackEnabled, setFallbackEnabled] = useState(initialSettings.deterministicFallbackEnabled);
  const [timeoutSeconds, setTimeoutSeconds] = useState(initialSettings.fallbackTimeoutSeconds);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving settings...");

    try {
      const response = await fetch("/api/admin/job-fit-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deterministicFallbackEnabled: fallbackEnabled,
          fallbackTimeoutSeconds: timeoutSeconds
        })
      });
      const payload = (await response.json()) as { error?: unknown };
      if (!response.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Could not save Job Fit settings.");
      }
      setMessage("Job Fit settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Job Fit settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void saveSettings(event)} className="surface mt-8 rounded-lg p-5">
      <div className="flex items-center gap-2">
        <Settings2 aria-hidden className="h-5 w-5 text-cobalt-500" />
        <h2 className="text-lg font-semibold">Job Fit Agent Settings</h2>
      </div>

      <div className="mt-5 grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <label className="flex min-h-11 items-center gap-3 rounded-md border hairline bg-[var(--panel-strong)] px-3">
          <input
            type="checkbox"
            checked={fallbackEnabled}
            onChange={(event) => setFallbackEnabled(event.target.checked)}
            className="h-4 w-4 accent-cobalt-600"
          />
          <span className="text-sm font-medium">Enable deterministic fallback</span>
        </label>

        <label>
          <span className="text-sm font-medium">Agent timeout (seconds)</span>
          <input
            type="number"
            min={5}
            max={120}
            step={1}
            value={timeoutSeconds}
            onChange={(event) => setTimeoutSeconds(Number(event.target.value))}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-50 dark:bg-ink-50 dark:text-ink-950"
        >
          <Save aria-hidden className="h-4 w-4" />
          {saving ? "Saving..." : "Save settings"}
        </button>
      </div>

      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        Rules-based scoring is used only when no model key is available. Configured-provider failures return an error after this wait limit instead of silently substituting a score.
      </p>
      {message ? <p className="mt-2 text-sm text-[var(--muted)]" aria-live="polite">{message}</p> : null}
    </form>
  );
}
