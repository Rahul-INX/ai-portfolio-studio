"use client";

import { useRouter } from "next/navigation";
import { InlineTextEditor } from "@/components/inline-text-editor";
import { useEditMode } from "@/components/edit-mode-provider";
import { readApiResponse } from "@/lib/api-response";
import type { SiteProfile } from "@/lib/types";

export function InlineProfileText({
  profile,
  field,
  label,
  value,
  multiline = false,
  className,
  asBlock = false
}: {
  profile: SiteProfile;
  field: keyof SiteProfile;
  label: string;
  value: string;
  multiline?: boolean;
  className?: string;
  asBlock?: boolean;
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

  if (asBlock) {
    return (
      <div className={className}>
        <InlineTextEditor label={label} value={value} multiline={multiline} onSave={save} />
      </div>
    );
  }

  return (
    <span className={className}>
      <InlineTextEditor label={label} value={value} multiline={multiline} onSave={save} />
    </span>
  );
}
