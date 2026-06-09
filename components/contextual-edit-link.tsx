"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useEditMode } from "@/components/edit-mode-provider";

export function ContextualEditLink({
  kind,
  record,
  label
}: {
  kind: string;
  record: string;
  label: string;
}) {
  const { editMode } = useEditMode();
  if (!editMode) return null;

  return (
    <Link
      href={`/admin/new-project?kind=${encodeURIComponent(kind)}&record=${encodeURIComponent(record)}`}
      className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--foreground)] px-3 text-xs font-semibold text-[var(--background)] shadow-[var(--shadow-raised)] transition hover:bg-[var(--accent)] hover:text-white"
      aria-label={`Edit ${label}`}
    >
      <Pencil aria-hidden className="h-3.5 w-3.5" />
      Edit
    </Link>
  );
}
