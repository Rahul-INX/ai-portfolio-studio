"use client";

import { useRouter } from "next/navigation";
import { InlineTextEditor } from "@/components/inline-text-editor";
import { useEditMode } from "@/components/edit-mode-provider";
import { readApiResponse } from "@/lib/api-response";
import type { SiteProfile } from "@/lib/types";

export function InlineProfileBlock({
  profile,
  field,
  label,
  value,
  className
}: {
  profile: SiteProfile;
  field: keyof SiteProfile;
  label: string;
  value: string;
  className?: string;
}) {
  const router = useRouter();
  const { editMode } = useEditMode();

  async function save(nextValue: string) {
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "site-profile", ...profile, [field]: nextValue, id: undefined })
    });
    await readApiResponse(response);
    router.refresh();
  }

  if (!editMode) {
    return <span className={className}>{value}</span>;
  }

  return (
    <div className={className}>
      <InlineTextEditor label={label} value={value} multiline onSave={save} />
    </div>
  );
}
