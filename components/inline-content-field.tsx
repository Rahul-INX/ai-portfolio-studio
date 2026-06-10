"use client";

import { useRouter } from "next/navigation";
import { InlineTextEditor } from "@/components/inline-text-editor";
import { useEditMode } from "@/components/edit-mode-provider";
import { readApiResponse } from "@/lib/api-response";
import type { ExplorerItem, SafeProject } from "@/lib/types";

type EditableItem = ExplorerItem | SafeProject;

export function InlineContentField({
  item,
  field,
  label,
  value,
  multiline = false,
  className
}: {
  item: EditableItem;
  field: string;
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const { editMode } = useEditMode();

  async function save(nextValue: string) {
    const payload = { ...item, [field]: nextValue } as Record<string, unknown>;
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await readApiResponse(response);
    router.refresh();
  }

  if (!editMode) {
    return <span className={className}>{value}</span>;
  }

  return <InlineTextEditor label={label} value={value} multiline={multiline} onSave={save} />;
}
