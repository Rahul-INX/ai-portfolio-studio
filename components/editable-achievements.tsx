"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowUpRight,
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Move,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { readApiResponse } from "@/lib/api-response";
import { resolvePortfolioMedia } from "@/lib/media";
import { useEditMode } from "@/components/edit-mode-provider";
import type { AchievementSignal, SiteProfile } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Draft = {
  id?: string;
  title: string;
  issuer: string;
  category: string;
  summary: string;
  awardedAt: string;
  proofUrl: string;
  imageUrl: string;
  imageRatio: "1/1" | "4/3" | "16/9";
  imageFocus: string;
  highlighted: boolean;
  sortOrder: number;
  /** Local-only: tracks whether this card's edit panel is open */
  _editing?: boolean;
  /** Local-only: tracks save/delete in-progress */
  _saving?: boolean;
  /** Local-only: last message for this card */
  _message?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDraft(value?: AchievementSignal): Draft {
  return {
    id: value?.id,
    title: value?.title ?? "",
    issuer: value?.issuer ?? "",
    category: value?.category ?? "",
    summary: value?.summary ?? "",
    awardedAt: value?.awardedAt ? new Date(value.awardedAt as string).toISOString().slice(0, 10) : "",
    proofUrl: value?.proofUrl ?? "",
    imageUrl: value?.imageUrl ?? "",
    imageRatio: value?.imageRatio ?? "4/3",
    imageFocus: value?.imageFocus ?? "50% 50%",
    highlighted: Boolean(value?.highlighted),
    sortOrder: Number(value?.sortOrder ?? 0)
  };
}

function formatDate(value?: Date | string | null) {
  if (!value) return "Verified learning";
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) return "Verified learning";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

function draftKey(draft: Draft, index: number) {
  return draft.id ?? `local-${index}`;
}

async function uploadImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/media", { method: "POST", body: form });
  const payload = await readApiResponse<{ url?: string }>(response);
  return payload.url ?? null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EditableAchievements({
  items,
  profile
}: {
  items: AchievementSignal[];
  profile: SiteProfile;
}) {
  const router = useRouter();
  const { authenticated, editMode } = useEditMode();

  // ── Heading draft state ──────────────────────────────────────────────────────
  const [heading, setHeading] = useState({
    eyebrow: profile.awardsEyebrow,
    title: profile.awardsTitle,
    description: profile.awardsDescription
  });
  const [headingStatus, setHeadingStatus] = useState<"clean" | "dirty" | "saving" | "saved" | "error">("clean");
  const [headingMsg, setHeadingMsg] = useState("");
  const [headingEditing, setHeadingEditing] = useState(false);

  function patchHeading(patch: Partial<typeof heading>) {
    setHeading((prev) => ({ ...prev, ...patch }));
    setHeadingStatus("dirty");
    setHeadingMsg("");
  }

  async function saveHeading() {
    setHeadingStatus("saving");
    setHeadingMsg("Saving…");
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "site-profile",
          ...profile,
          awardsEyebrow: heading.eyebrow,
          awardsTitle: heading.title,
          awardsDescription: heading.description
        })
      });
      await readApiResponse(response);
      setHeadingStatus("saved");
      setHeadingMsg("Saved ✓");
      setHeadingEditing(false);
      router.refresh();
    } catch (error) {
      setHeadingStatus("error");
      setHeadingMsg(error instanceof Error ? error.message : "Save failed.");
    }
  }

  const [drafts, setDrafts] = useState<Draft[]>(() =>
    items.map((item) => toDraft(item)).sort(
      (a, b) => Number(b.highlighted) - Number(a.highlighted) || a.sortOrder - b.sortOrder
    )
  );

  // ── Per-card state helpers ──────────────────────────────────────────────────

  function patchDraft(index: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function openEditor(index: number) {
    setDrafts((prev) =>
      prev.map((d, i) => ({
        ...d,
        _editing: i === index ? !d._editing : false,
        _message: i === index ? d._message : undefined
      }))
    );
  }

  function closeEditor(index: number) {
    patchDraft(index, { _editing: false, _message: undefined });
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function save(index: number) {
    const draft = drafts[index];
    patchDraft(index, { _saving: true, _message: "Saving…" });
    try {
      const isNew = !draft.id || draft.id.startsWith("new-");
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "achievement",
          id: isNew ? undefined : draft.id,
          title: draft.title,
          issuer: draft.issuer,
          category: draft.category,
          summary: draft.summary,
          awardedAt: draft.awardedAt,
          proofUrl: draft.proofUrl,
          imageUrl: draft.imageUrl,
          imageRatio: draft.imageRatio,
          imageFocus: draft.imageFocus,
          highlighted: draft.highlighted,
          sortOrder: draft.sortOrder
        })
      });
      const payload = await readApiResponse<{ item: AchievementSignal }>(response);
      const saved = toDraft(payload.item as AchievementSignal);
      setDrafts((prev) =>
        prev.map((d, i) =>
          i === index
            ? { ...saved, _editing: false, _saving: false, _message: "Saved ✓" }
            : d
        )
      );
      router.refresh();
    } catch (error) {
      patchDraft(index, {
        _saving: false,
        _message: error instanceof Error ? error.message : "Save failed."
      });
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function remove(index: number) {
    const draft = drafts[index];
    if (!draft.id || draft.id.startsWith("new-")) {
      setDrafts((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm(`Delete "${draft.title}"? This cannot be undone.`)) return;
    patchDraft(index, { _saving: true, _message: "Deleting…" });
    try {
      const response = await fetch("/api/content", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "achievement", id: draft.id })
      });
      await readApiResponse(response);
      setDrafts((prev) => prev.filter((_, i) => i !== index));
      router.refresh();
    } catch (error) {
      patchDraft(index, {
        _saving: false,
        _message: error instanceof Error ? error.message : "Delete failed."
      });
    }
  }

  // ── Add new ─────────────────────────────────────────────────────────────────

  function addNew() {
    const newDraft: Draft = {
      id: `new-${Date.now()}`,
      title: "",
      issuer: "",
      category: "",
      summary: "",
      awardedAt: "",
      proofUrl: "",
      imageUrl: "",
      imageRatio: "4/3",
      imageFocus: "50% 50%",
      highlighted: false,
      sortOrder: drafts.length,
      _editing: true
    };
    setDrafts((prev) => [
      ...prev.map((d) => ({ ...d, _editing: false })),
      newDraft
    ]);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  const headingNode = (
    <div className="grid max-w-5xl gap-4 md:grid-cols-[0.34fr_1fr] md:gap-8">
      <p className="eyebrow pt-1">{heading.eyebrow}</p>
      <div>
        <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          {heading.title}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
          {heading.description}
        </p>
      </div>
    </div>
  );

  if (!authenticated) {
    return (
      <>
        {headingNode}
        <div className="mt-9">
          <AchievementsDisplay items={drafts} editMode={false} />
        </div>
      </>
    );
  }

  return (
    <>
      {/* ── Section heading with inline editor ── */}
      <div className="group/heading relative">
        {headingEditing ? (
          <div className="rounded-xl border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent),transparent_94%)] p-5">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-[var(--accent)]">Editing section heading</p>
              <button
                type="button"
                onClick={() => { setHeadingEditing(false); setHeadingStatus("clean"); setHeadingMsg(""); }}
                className="grid h-8 w-8 place-items-center rounded-md border hairline hover:bg-[var(--panel)]"
                aria-label="Close heading editor"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              <label>
                <span className="text-xs font-semibold text-[var(--muted)]">Eyebrow</span>
                <input
                  value={heading.eyebrow}
                  onChange={(e) => patchHeading({ eyebrow: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label>
                <span className="text-xs font-semibold text-[var(--muted)]">Title</span>
                <textarea
                  value={heading.title}
                  rows={2}
                  onChange={(e) => patchHeading({ title: e.target.value })}
                  className="mt-1.5 w-full resize-none rounded-lg border hairline bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
              <label>
                <span className="text-xs font-semibold text-[var(--muted)]">Description</span>
                <textarea
                  value={heading.description}
                  rows={3}
                  onChange={(e) => patchHeading({ description: e.target.value })}
                  className="mt-1.5 w-full resize-none rounded-lg border hairline bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4">
              <button
                type="button"
                onClick={() => void saveHeading()}
                disabled={headingStatus === "saving" || headingStatus === "clean"}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-40"
              >
                <Check aria-hidden className="h-3.5 w-3.5" />
                {headingStatus === "saving" ? "Saving…" : "Save heading"}
              </button>
              {headingMsg && (
                <p className={`text-xs ${headingStatus === "error" ? "text-rose-600 dark:text-rose-400" : "text-[var(--accent)]"}`}>
                  {headingMsg}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            {headingNode}
            {editMode && (
              <button
                type="button"
                onClick={() => setHeadingEditing(true)}
                className="absolute -right-1 -top-1 grid h-8 w-8 place-items-center rounded-md border hairline bg-[var(--panel)] opacity-0 shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)] group-hover/heading:opacity-100"
                aria-label="Edit section heading"
              >
                <Pencil aria-hidden className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Achievement cards ── */}
      <div className="mt-9">
        <AchievementsDisplay
          items={drafts}
          editMode={editMode}
          onToggleEdit={openEditor}
          onClose={closeEditor}
          onSave={save}
          onDelete={remove}
          onAdd={addNew}
          onPatch={patchDraft}
          onUpload={uploadImage}
        />
      </div>
    </>
  );
}

// ─── Display Layer ───────────────────────────────────────────────────────────

function AchievementsDisplay({
  items,
  editMode,
  onToggleEdit,
  onClose,
  onSave,
  onDelete,
  onAdd,
  onPatch,
  onUpload
}: {
  items: Draft[];
  editMode: boolean;
  onToggleEdit?: (index: number) => void;
  onClose?: (index: number) => void;
  onSave?: (index: number) => Promise<void>;
  onDelete?: (index: number) => Promise<void>;
  onAdd?: () => void;
  onPatch?: (index: number, patch: Partial<Draft>) => void;
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const highlighted = items.filter((d) => d.highlighted);
  const rest = items.filter((d) => !d.highlighted);
  const sorted = [...highlighted, ...rest];

  return (
    <div className="space-y-6">
      {/* Info panel when in edit mode */}
      {editMode && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent),transparent_92%)] px-5 py-4">
          <div className="flex items-center gap-3">
            <Pencil aria-hidden className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            <p className="text-sm font-medium text-[var(--accent)]">
              Edit mode — click <strong>Edit</strong> on any card below to modify it directly on the page.
            </p>
          </div>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Plus aria-hidden className="h-3.5 w-3.5" />
              Add achievement
            </button>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total", `${items.length} records`],
          ["Highlighted", `${items.filter((d) => d.highlighted).length} featured`],
          [
            "Categories",
            [...new Set(items.map((d) => d.category))].filter(Boolean).slice(0, 3).join(", ") || "Ready"
          ]
        ].map(([label, value]) => (
          <div key={label} className="surface rounded-xl border hairline p-4">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
            <p className="mt-2 line-clamp-2 text-base font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Achievement cards grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((draft, rawIndex) => {
          const index = items.indexOf(draft);
          return (
            <AchievementCard
              key={draft.id ?? `local-${rawIndex}`}
              draft={draft}
              index={index}
              editMode={editMode}
              onToggleEdit={() => onToggleEdit?.(index)}
              onClose={() => onClose?.(index)}
              onSave={async () => { await onSave?.(index); }}
              onDelete={async () => { await onDelete?.(index); }}
              onPatch={(patch) => onPatch?.(index, patch)}
              onUpload={onUpload}
            />
          );
        })}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed hairline py-16 text-center">
            <Award aria-hidden className="h-8 w-8 text-[var(--muted)]" />
            <div>
              <p className="font-semibold">No achievements yet</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Click "Add achievement" above to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Individual Achievement Card ─────────────────────────────────────────────

function AchievementCard({
  draft,
  index,
  editMode,
  onToggleEdit,
  onClose,
  onSave,
  onDelete,
  onPatch,
  onUpload
}: {
  draft: Draft;
  index: number;
  editMode: boolean;
  onToggleEdit: () => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPatch: (patch: Partial<Draft>) => void;
  onUpload?: (file: File) => Promise<string | null>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isNew = !draft.id || draft.id.startsWith("new-");
  const aspectClass =
    draft.imageRatio === "16/9"
      ? "aspect-video"
      : draft.imageRatio === "1/1"
        ? "aspect-square"
        : "aspect-[4/3]";

  // ── Expand/collapse summary state ──────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const COLLAPSE_LINES = 3;
  const lines = (draft.summary || "").split("\n");
  const needsExpand = lines.length > COLLAPSE_LINES || (draft.summary || "").length > 180;

  // ── Drag-to-reposition image state ─────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  function parseFocus(focus?: string | null): [number, number] {
    if (!focus) return [50, 50];
    const parts = focus.split(" ");
    return [parseFloat(parts[0]) || 50, parseFloat(parts[1]) || 50];
  }

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!editMode || !draft.imageUrl) return;
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const [fx, fy] = parseFocus(draft.imageFocus);
    dragOrigin.current = { x: clientX, y: clientY, fx, fy };
    setDragging(true);
  }, [editMode, draft.imageUrl, draft.imageFocus]);

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging || !dragOrigin.current || !imgContainerRef.current) return;
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = imgContainerRef.current.getBoundingClientRect();
    // Map pixel delta to percentage delta (inverted: drag right → image moves right → focus decreases)
    const dx = ((clientX - dragOrigin.current.x) / rect.width) * 100;
    const dy = ((clientY - dragOrigin.current.y) / rect.height) * 100;
    const newFx = Math.min(100, Math.max(0, dragOrigin.current.fx - dx));
    const newFy = Math.min(100, Math.max(0, dragOrigin.current.fy - dy));
    onPatch({ imageFocus: `${newFx.toFixed(1)}% ${newFy.toFixed(1)}%` });
  }, [dragging, onPatch]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    dragOrigin.current = null;
  }, []);

  return (
    <article className={`surface overflow-hidden rounded-2xl transition-all ${editMode ? "ring-1 ring-[var(--line-strong)]" : ""}`}>
      {/* ── Image area ── */}
      {draft.imageUrl ? (
        <div
          ref={imgContainerRef}
          className={`relative overflow-hidden ${aspectClass} ${editMode ? "cursor-grab select-none" : ""} ${dragging ? "cursor-grabbing" : ""}`}
          onMouseDown={editMode ? handleDragStart : undefined}
          onMouseMove={editMode && dragging ? handleDragMove : undefined}
          onMouseUp={editMode ? handleDragEnd : undefined}
          onMouseLeave={editMode ? handleDragEnd : undefined}
          onTouchStart={editMode ? handleDragStart : undefined}
          onTouchMove={editMode && dragging ? handleDragMove : undefined}
          onTouchEnd={editMode ? handleDragEnd : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvePortfolioMedia(draft.imageUrl)}
            alt={`${draft.title} proof image`}
            draggable={false}
            className="h-full w-full object-cover transition-none"
            style={{ objectPosition: draft.imageFocus }}
          />
          {/* Drag hint overlay shown in edit mode */}
          {editMode && !dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm">
                <Move aria-hidden className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
          {editMode && (
            <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-[0.6rem] font-medium text-white backdrop-blur-sm">
              <Move aria-hidden className="h-3 w-3" />
              Drag to reposition
            </div>
          )}
        </div>
      ) : (
        <div className={`grid ${aspectClass} place-items-center bg-[var(--panel-strong)] text-[var(--muted)]`}>
          <ImageIcon aria-hidden className="h-6 w-6" />
        </div>
      )}

      {/* ── Card content ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Award aria-hidden className="h-4 w-4 shrink-0" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]">
                {draft.category || "Category"} / {formatDate(draft.awardedAt)}
              </p>
            </div>
            {draft.highlighted && (
              <span className="mt-1 inline-flex items-center rounded-full bg-[color-mix(in_srgb,var(--signal),transparent_84%)] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-[var(--signal)]">
                Featured
              </span>
            )}
            <h3 className="mt-3 text-base font-semibold leading-snug">{draft.title || "New Achievement"}</h3>
            <p className="mt-1.5 text-sm text-[var(--muted)]">{draft.issuer || "Issuer"}</p>

            {/* Summary with newline preservation + expand/collapse */}
            <div className="mt-3">
              <p
                className={`text-sm leading-6 text-[color-mix(in_srgb,var(--foreground),transparent_28%)] whitespace-pre-wrap ${
                  !expanded && needsExpand ? "line-clamp-3" : ""
                }`}
              >
                {draft.summary || "Add a summary…"}
              </p>
              {needsExpand && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:opacity-75 transition-opacity"
                >
                  {expanded ? (
                    <><ChevronUp aria-hidden className="h-3.5 w-3.5" /> View less</>
                  ) : (
                    <><ChevronDown aria-hidden className="h-3.5 w-3.5" /> View more</>
                  )}
                </button>
              )}
            </div>

            {draft.proofUrl && !editMode ? (
              <a
                href={draft.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)]"
              >
                View proof <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>

          {/* Edit toggle button */}
          {editMode && (
            <button
              type="button"
              onClick={onToggleEdit}
              aria-expanded={draft._editing}
              aria-label={draft._editing ? "Close editor" : "Edit achievement"}
              className={`ml-2 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                draft._editing
                  ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent),transparent_88%)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-[var(--panel-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {draft._editing ? <ChevronUp aria-hidden className="h-4 w-4" /> : <Pencil aria-hidden className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* ── Inline edit panel ── */}
        {editMode && draft._editing && (
          <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent),transparent_96%)] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                {isNew ? "New achievement" : "Editing"}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="grid h-6 w-6 place-items-center rounded-md text-[var(--muted)] hover:text-[var(--foreground)]"
                aria-label="Close edit panel"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Title */}
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-[var(--muted)]">Title *</span>
                <input
                  value={draft.title}
                  onChange={(e) => onPatch({ title: e.target.value })}
                  placeholder="e.g. Best Paper Award"
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Issuer */}
              <label>
                <span className="text-xs font-medium text-[var(--muted)]">Issuer *</span>
                <input
                  value={draft.issuer}
                  onChange={(e) => onPatch({ issuer: e.target.value })}
                  placeholder="e.g. IEEE"
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Category */}
              <label>
                <span className="text-xs font-medium text-[var(--muted)]">Category *</span>
                <input
                  value={draft.category}
                  onChange={(e) => onPatch({ category: e.target.value })}
                  placeholder="e.g. Research"
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Summary */}
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-[var(--muted)]">Summary *</span>
                <textarea
                  value={draft.summary}
                  onChange={(e) => onPatch({ summary: e.target.value })}
                  placeholder="Brief description of this achievement… (newlines are preserved)"
                  rows={5}
                  className="mt-1.5 w-full resize-y rounded-lg border hairline bg-[var(--panel)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Awarded date */}
              <label>
                <span className="text-xs font-medium text-[var(--muted)]">Awarded date</span>
                <input
                  type="date"
                  value={draft.awardedAt}
                  onChange={(e) => onPatch({ awardedAt: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Image ratio */}
              <label>
                <span className="text-xs font-medium text-[var(--muted)]">Image ratio</span>
                <select
                  value={draft.imageRatio}
                  onChange={(e) => onPatch({ imageRatio: e.target.value as Draft["imageRatio"] })}
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                >
                  <option value="4/3">4:3 — balanced card</option>
                  <option value="16/9">16:9 — wide certificate</option>
                  <option value="1/1">1:1 — square badge</option>
                </select>
              </label>

              {/* Proof URL */}
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-[var(--muted)]">Proof URL</span>
                <input
                  type="url"
                  value={draft.proofUrl}
                  onChange={(e) => onPatch({ proofUrl: e.target.value })}
                  placeholder="https://credential.link/…"
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Sort order */}
              <label>
                <span className="text-xs font-medium text-[var(--muted)]">Sort order</span>
                <input
                  type="number"
                  min={0}
                  value={draft.sortOrder}
                  onChange={(e) => onPatch({ sortOrder: Number(e.target.value) })}
                  className="mt-1.5 h-10 w-full rounded-lg border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </label>

              {/* Highlighted toggle */}
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border hairline bg-[var(--panel)] px-3 py-2.5 self-end">
                <span>
                  <span className="block text-xs font-semibold">Featured</span>
                  <span className="block text-[0.65rem] text-[var(--muted)]">Show in highlights</span>
                </span>
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={draft.highlighted}
                    onChange={(e) => onPatch({ highlighted: e.target.checked })}
                    className="peer sr-only"
                  />
                  <span className="h-5 w-9 rounded-full bg-[var(--line)] transition peer-checked:bg-[var(--accent)] after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
                </span>
              </label>

              {/* Image section */}
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-[var(--muted)]">Proof image</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border hairline bg-[var(--panel)] px-3 text-xs font-medium transition hover:border-[var(--accent)]">
                    <Upload aria-hidden className="h-3.5 w-3.5" />
                    Upload
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="sr-only"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file || !onUpload) return;
                        onPatch({ _message: "Uploading image…" });
                        const url = await onUpload(file);
                        onPatch({ imageUrl: url ?? draft.imageUrl, _message: url ? "Image ready. Save to publish." : "Upload failed." });
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    />
                  </label>
                  {draft.imageUrl && (
                    <button
                      type="button"
                      onClick={() => onPatch({ imageUrl: "" })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border hairline bg-[var(--panel)] px-3 text-xs font-medium transition hover:border-rose-400 hover:text-rose-600"
                    >
                      <X aria-hidden className="h-3 w-3" /> Remove image
                    </button>
                  )}
                  {draft.imageUrl && (
                    <span className="truncate max-w-[8rem] text-[0.65rem] text-[var(--muted)]" title={draft.imageUrl}>
                      {draft.imageUrl.split("/").pop()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4">
              <button
                type="button"
                onClick={onSave}
                disabled={draft._saving || !draft.title || !draft.issuer || !draft.category || !draft.summary}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-40"
              >
                <Check aria-hidden className="h-3.5 w-3.5" />
                {draft._saving ? "Saving…" : "Save & publish"}
              </button>

              {!isNew && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={draft._saving}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-300 px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50/50 disabled:opacity-40 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/20"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  Delete
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg border hairline px-3 text-xs font-medium transition hover:border-[var(--accent)]"
              >
                Cancel
              </button>

              {draft._message && (
                <span
                  className={`text-xs ${draft._message.includes("fail") || draft._message.includes("Error") ? "text-rose-600 dark:text-rose-400" : "text-[var(--muted)]"}`}
                  aria-live="polite"
                >
                  {draft._message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Edit mode quick actions shown below card when not editing */}
        {editMode && !draft._editing && (
          <div className="mt-4 flex flex-wrap gap-2 border-t hairline pt-4">
            <button
              type="button"
              onClick={onToggleEdit}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border hairline px-3 text-xs font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <Pencil aria-hidden className="h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-600 transition hover:bg-rose-50/50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
            >
              <Trash2 aria-hidden className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
