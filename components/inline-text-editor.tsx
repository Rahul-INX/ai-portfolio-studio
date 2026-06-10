"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";

type InlineTextEditorProps = {
  label: string;
  value: string;
  multiline?: boolean;
  disabled?: boolean;
  onSave: (value: string) => Promise<void> | void;
};

export function InlineTextEditor({ label, value, multiline = false, disabled = false, onSave }: InlineTextEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("Saving...");
    try {
      await onSave(draft);
      setMessage("Saved");
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (disabled) {
    return <>{value}</>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setOpen(true);
        }}
        className="group inline-flex w-full items-start gap-2 text-left"
        aria-label={`Edit ${label}`}
      >
        <span className="min-w-0 flex-1">{value}</span>
        <Pencil aria-hidden className="mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--panel-strong)] p-3 shadow-[var(--shadow-raised)]">
      {multiline ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          className="w-full rounded-md border hairline bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      ) : (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="h-11 w-full rounded-md border hairline bg-[var(--panel)] px-3 outline-none focus:border-[var(--accent)]"
        />
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--foreground)] px-3 text-xs font-semibold text-[var(--background)] disabled:opacity-50"
        >
          <Check aria-hidden className="h-3.5 w-3.5" />
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border hairline px-3 text-xs font-medium"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
          Cancel
        </button>
        {message ? <span className="text-xs text-[var(--muted)]">{message}</span> : null}
      </div>
    </div>
  );
}
