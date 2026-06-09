"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { useEditMode } from "@/components/edit-mode-provider";

export function EditableSection({
  label,
  children,
  editor
}: {
  label: string;
  children: React.ReactNode;
  editor: (controls: { close: () => void }) => React.ReactNode;
}) {
  const { editMode } = useEditMode();
  const [open, setOpen] = useState(false);

  return (
    <div
      className={editMode ? "group/edit relative rounded-xl outline outline-1 outline-dashed outline-[var(--line-strong)]" : ""}
    >
      {children}
      {editMode ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 top-3 z-20 inline-flex h-9 items-center gap-2 rounded-full bg-[var(--foreground)] px-3 text-xs font-semibold text-[var(--background)] shadow-[var(--shadow-raised)] transition hover:bg-[var(--accent)] hover:text-white"
          aria-label={`Edit ${label}`}
        >
          <Pencil aria-hidden className="h-3.5 w-3.5" />
          Edit
        </button>
      ) : null}
      {editMode && open ? (
        <div className="fixed inset-0 z-[70] bg-black/25" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${label}`}
            className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-2xl sm:p-7"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {editor({ close: () => setOpen(false) })}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
