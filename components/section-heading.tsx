"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEditMode } from "@/components/edit-mode-provider";
import { InlineTextEditor } from "@/components/inline-text-editor";
import { readApiResponse } from "@/lib/api-response";
import type { SiteProfile } from "@/lib/types";

export function SectionHeading({
  eyebrow,
  title,
  description,
  profile,
  editable,
  level = "h2"
}: {
  eyebrow: string;
  title: string;
  description: string;
  profile?: SiteProfile;
  editable?: {
    eyebrow?: keyof SiteProfile;
    title?: keyof SiteProfile;
    description?: keyof SiteProfile;
  };
  level?: "h1" | "h2";
}) {
  const router = useRouter();
  const { editMode } = useEditMode();
  const [draft, setDraft] = useState<SiteProfile | null>(profile ?? null);

  async function saveField(field: keyof SiteProfile, value: string) {
    if (!draft) return;
    const next = { ...draft, [field]: value } as SiteProfile;
    setDraft(next);
    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "site-profile", ...next, id: undefined })
    });
    await readApiResponse(response);
    router.refresh();
  }

  const current = draft ?? profile;
  const Heading = level;

  return (
    <div className="grid max-w-5xl gap-4 md:grid-cols-[0.34fr_1fr] md:gap-8">
      <div className="pt-1">
        {editMode && editable?.eyebrow && current ? (
          <InlineTextEditor
            label={String(editable.eyebrow)}
            value={String(current[editable.eyebrow] ?? eyebrow)}
            onSave={(value) => saveField(editable.eyebrow!, value)}
          />
        ) : (
          <p className="eyebrow">{eyebrow}</p>
        )}
      </div>
      <div>
        <Heading className="editorial-title text-balance text-3xl text-[var(--foreground)] sm:text-4xl">
          {editMode && editable?.title && current ? (
            <InlineTextEditor
              label={String(editable.title)}
              value={String(current[editable.title] ?? title)}
              onSave={(value) => saveField(editable.title!, value)}
            />
          ) : title}
        </Heading>
        <div className="mt-4 max-w-3xl text-base leading-7 text-[color-mix(in_srgb,var(--foreground),transparent_28%)]">
          {editMode && editable?.description && current ? (
            <InlineTextEditor
              label={String(editable.description)}
              value={String(current[editable.description] ?? description)}
              multiline
              onSave={(value) => saveField(editable.description!, value)}
            />
          ) : (
            <p>{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
