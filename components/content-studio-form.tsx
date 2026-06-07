"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import type {
  CertificationSignal,
  PortfolioDocument,
  SafeBlog,
  SafeCaseStudy,
  SafeDashboard,
  SafeExperiment,
  SafeProject,
  SiteProfile,
  SkillSignal,
  TimelineItem
} from "@/lib/types";

type EditableKind =
  | "site-profile"
  | "project"
  | "case-study"
  | "experiment"
  | "blog"
  | "dashboard"
  | "skill"
  | "certification"
  | "timeline"
  | "document";

type EditableRecord = Record<string, unknown> & { id?: string; kind?: EditableKind; title?: string; slug?: string; name?: string };

type StudioData = {
  profile: SiteProfile;
  projects: SafeProject[];
  caseStudies: SafeCaseStudy[];
  experiments: SafeExperiment[];
  blogs: SafeBlog[];
  dashboards: SafeDashboard[];
  skills: SkillSignal[];
  certifications: CertificationSignal[];
  timeline: TimelineItem[];
  documents: PortfolioDocument[];
};

const kindLabels: Record<EditableKind, string> = {
  "site-profile": "Site Profile",
  project: "Project",
  "case-study": "Case Study",
  experiment: "Experiment",
  blog: "Blog",
  dashboard: "Dashboard",
  skill: "Skill",
  certification: "Certification",
  timeline: "Timeline Event",
  document: "Document"
};

const textFields: Record<EditableKind, string[]> = {
  "site-profile": [
    "name",
    "initials",
    "role",
    "profileImageUrl",
    "contactEmail",
    "contactPhone",
    "contactLocation",
    "heroEyebrow",
    "heroTitle",
    "heroSummary",
    "primaryCtaLabel",
    "secondaryCtaLabel",
    "focusLabel",
    "focusValue",
    "styleLabel",
    "styleValue",
    "modelLabel",
    "modelValue",
    "explorerEyebrow",
    "explorerTitle",
    "explorerDescription",
    "timelineEyebrow",
    "timelineTitle",
    "timelineDescription",
    "adminEyebrow",
    "adminTitle",
    "adminDescription",
    "seoTitle",
    "seoDescription"
  ],
  project: ["subtitle", "summary", "description", "businessImpact", "imageUrl", "startDate", "endDate"],
  "case-study": ["summary", "problem", "context", "approach", "businessValue", "imageUrl"],
  experiment: ["summary", "hypothesis", "method", "findings", "nextStep", "imageUrl"],
  blog: ["excerpt", "content", "seoTitle", "seoSummary", "imageUrl"],
  dashboard: ["summary", "embedUrl", "imageUrl"],
  skill: ["category", "level", "weight"],
  certification: ["issuer", "issuedAt", "url"],
  timeline: ["period", "description", "signal", "sortOrder"],
  document: ["description", "fileUrl", "versionLabel"]
};

const longFields = new Set([
  "heroSummary",
  "explorerDescription",
  "timelineDescription",
  "adminDescription",
  "description",
  "businessImpact",
  "problem",
  "context",
  "approach",
  "businessValue",
  "hypothesis",
  "method",
  "findings",
  "nextStep",
  "content"
]);

async function uploadDocument(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/document-upload", { method: "POST", body: form });
  if (!response.ok) return null;
  const payload = (await response.json()) as { url?: string };
  return payload.url ?? null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listValue(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function dateValue(value: unknown) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
}

function labelFor(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace("Seo", "SEO");
}

export function ContentStudioForm({ data }: { data: StudioData }) {
  const [kind, setKind] = useState<EditableKind>("site-profile");
  const [selectedKey, setSelectedKey] = useState("main");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [techStack, setTechStack] = useState("");
  const [statusValue, setStatusValue] = useState("ACTIVE");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => profileValues(data.profile));
  const [message, setMessage] = useState("");
  const [savedSignature, setSavedSignature] = useState(() =>
    signatureFor("site-profile", "", "", "", "", "ACTIVE", profileValues(data.profile))
  );
  const [saving, setSaving] = useState(false);

  const records = useMemo<Record<EditableKind, EditableRecord[]>>(
    () => ({
      "site-profile": [{ ...data.profile, kind: "site-profile", title: data.profile.name }],
      project: data.projects.map((item) => ({ ...item, kind: "project" })),
      "case-study": data.caseStudies.map((item) => ({ ...item, kind: "case-study" })),
      experiment: data.experiments.map((item) => ({ ...item, kind: "experiment" })),
      blog: data.blogs.map((item) => ({ ...item, kind: "blog" })),
      dashboard: data.dashboards.map((item) => ({ ...item, kind: "dashboard" })),
      skill: data.skills.map((item) => ({ ...item, kind: "skill", title: item.name })),
      certification: data.certifications.map((item) => ({ ...item, kind: "certification" })),
      timeline: data.timeline.map((item) => ({ ...item, kind: "timeline" })),
      document: data.documents.map((item) => ({ ...item, id: item.kind, documentKind: item.kind, kind: "document", title: item.title }))
    }),
    [data]
  );

  const selectedRecords = records[kind];

  function profileValues(profile: SiteProfile) {
    return Object.fromEntries(textFields["site-profile"].map((field) => [field, String(profile[field as keyof SiteProfile] ?? "")]));
  }

  function loadRecord(nextKind: EditableKind, key: string) {
    const record = records[nextKind].find((item, index) => recordKey(item, index) === key);
    setMessage("");
    setSelectedKey(key);
    if (!record) {
      setTitle("");
      setSlug("");
      setTags("");
      setTechStack("");
      setStatusValue("ACTIVE");
      const emptyValues = Object.fromEntries(textFields[nextKind].map((field) => [field, ""]));
      setFieldValues(emptyValues);
      setSavedSignature(signatureFor(nextKind, "", "", "", "", "ACTIVE", emptyValues));
      return;
    }
    const nextValues = Object.fromEntries(
      textFields[nextKind].map((field) => [
        field,
        ["issuedAt", "startDate", "endDate"].includes(field) ? dateValue(record[field]) : String(record[field] ?? "")
      ])
    );
    setTitle(String(record.title ?? record.name ?? ""));
    setSlug(String(record.slug ?? ""));
    setTags(listValue(record.tags));
    setTechStack(listValue(record.techStack));
    setStatusValue(String(record.status ?? "ACTIVE"));
    setFieldValues(nextValues);
    setSavedSignature(
      signatureFor(
        nextKind,
        String(record.title ?? record.name ?? ""),
        String(record.slug ?? ""),
        listValue(record.tags),
        listValue(record.techStack),
        String(record.status ?? "ACTIVE"),
        nextValues
      )
    );
  }

  function changeKind(nextKind: EditableKind) {
    setKind(nextKind);
    const firstKey = nextKind === "site-profile" ? "main" : nextKind === "document" ? "RESUME" : "new";
    loadRecord(nextKind, firstKey);
  }

  function recordKey(record: EditableRecord, index: number) {
    return String(record.id ?? record.slug ?? record.name ?? record.title ?? index);
  }

  function recordLabel(record: EditableRecord) {
    return String(record.title ?? record.name ?? record.slug ?? "Untitled");
  }

  function signatureFor(
    nextKind: EditableKind,
    nextTitle: string,
    nextSlug: string,
    nextTags: string,
    nextTechStack: string,
    nextStatus: string,
    nextFields: Record<string, string>
  ) {
    return JSON.stringify({
      kind: nextKind,
      title: nextTitle,
      slug: nextSlug,
      tags: nextTags,
      techStack: nextTechStack,
      status: nextStatus,
      fields: nextFields
    });
  }

  const currentSignature = signatureFor(kind, title, slug, tags, techStack, statusValue, fieldValues);
  const hasUnsavedChanges = currentSignature !== savedSignature;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving changes...");
    const selected = selectedRecords.find((item, index) => recordKey(item, index) === selectedKey);
    const common = {
      kind,
      title,
      slug: slug || slugify(title),
      tags: splitList(tags)
    };

    const payload =
      kind === "site-profile"
        ? { kind, ...fieldValues }
        : kind === "project"
          ? {
              ...common,
              subtitle: fieldValues.subtitle,
              summary: fieldValues.summary,
              description: fieldValues.description,
              businessImpact: fieldValues.businessImpact,
              imageUrl: fieldValues.imageUrl,
              startDate: fieldValues.startDate,
              endDate: fieldValues.endDate,
              status: statusValue,
              techStack: splitList(techStack),
              metrics: selected?.metrics ?? [{ label: "Portfolio signal", value: "Editable", accent: true }],
              architectureCanvas: selected?.architectureCanvas ?? {
                layers: ["Source", "Processing", "Presentation"],
                principles: ["Evidence first", "Admin editable"],
                riskControls: ["Public-safe wording", "Human review"]
              }
            }
          : kind === "case-study"
            ? {
                ...common,
                summary: fieldValues.summary,
                problem: fieldValues.problem,
                context: fieldValues.context,
                approach: fieldValues.approach,
                businessValue: fieldValues.businessValue,
                imageUrl: fieldValues.imageUrl
              }
            : kind === "experiment"
              ? {
                  ...common,
                  summary: fieldValues.summary,
                  hypothesis: fieldValues.hypothesis,
                  method: fieldValues.method,
                  findings: fieldValues.findings,
                  nextStep: fieldValues.nextStep,
                  imageUrl: fieldValues.imageUrl,
                  status: statusValue,
                  metrics: selected?.metrics ?? [{ label: "Experiment", value: "Editable", accent: true }]
                }
              : kind === "blog"
                ? {
                    ...common,
                    excerpt: fieldValues.excerpt,
                    content: fieldValues.content,
                    seoTitle: fieldValues.seoTitle,
                    seoSummary: fieldValues.seoSummary,
                    imageUrl: fieldValues.imageUrl,
                    readTime: Math.max(1, Math.ceil(String(fieldValues.content ?? "").split(/\s+/).filter(Boolean).length / 220))
                  }
                : kind === "dashboard"
                  ? { ...common, summary: fieldValues.summary, embedUrl: fieldValues.embedUrl, imageUrl: fieldValues.imageUrl }
                  : kind === "skill"
                    ? {
                        kind,
                        id: selected?.id,
                        name: title,
                        category: fieldValues.category,
                        level: Number(fieldValues.level || 1),
                        weight: Number(fieldValues.weight || 1)
                      }
                      : kind === "certification"
                        ? {
                            kind,
                            id: selected?.id,
                            title,
                            issuer: fieldValues.issuer,
                            issuedAt: fieldValues.issuedAt,
                            url: fieldValues.url
                          }
                        : kind === "document"
                          ? {
                              kind,
                              documentKind: String(selected?.documentKind ?? selected?.kind ?? selectedKey) === "CV" ? "CV" : "RESUME",
                              title,
                              description: fieldValues.description,
                              fileUrl: fieldValues.fileUrl,
                              versionLabel: fieldValues.versionLabel
                            }
                        : {
                          kind,
                          id: selected?.id,
                          title,
                          period: fieldValues.period,
                          description: fieldValues.description,
                          signal: fieldValues.signal,
                          sortOrder: Number(fieldValues.sortOrder || 0)
                        };

    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setSavedSignature(currentSignature);
        setMessage("Saved. Refresh the page to see the latest database content.");
      } else {
        setMessage("Save failed. Check database/auth configuration.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface mt-8 grid min-w-0 gap-4 rounded-lg p-4 sm:p-5 xl:p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-medium">Editable area</span>
          <select
            value={kind}
            onChange={(event) => changeKind(event.target.value as EditableKind)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3"
          >
            {(Object.keys(kindLabels) as EditableKind[]).map((item) => (
              <option key={item} value={item}>
                {kindLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium">Record</span>
          <select
            value={selectedKey}
            onChange={(event) => loadRecord(kind, event.target.value)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3"
          >
            {!["site-profile", "document"].includes(kind) ? <option value="new">Create new {kindLabels[kind].toLowerCase()}</option> : null}
            {selectedRecords.map((record, index) => (
              <option key={recordKey(record, index)} value={recordKey(record, index)}>
                {recordLabel(record)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {kind !== "site-profile" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="text-sm font-medium">Title</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slug) setSlug(slugify(event.target.value));
              }}
              required
              className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
            />
          </label>
          {!["skill", "certification", "timeline", "document"].includes(kind) ? (
            <label>
              <span className="text-sm font-medium">Slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                required
                className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {kind === "document" ? (
        <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label>
            <span className="text-sm font-medium">Upload PDF, DOC, or DOCX</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setMessage("Uploading document...");
                const url = await uploadDocument(file);
                setMessage(url ? "Document uploaded. Save editable content to publish it." : "Document upload failed.");
                if (url) setFieldValues((current) => ({ ...current, fileUrl: url }));
              }}
              className="mt-2 block w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 py-2 text-sm"
            />
          </label>
          {fieldValues.fileUrl ? (
            <Link
              href={fieldValues.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border hairline bg-[var(--panel-strong)] px-4 text-sm font-medium transition hover:border-cobalt-500"
            >
              <Download aria-hidden className="h-4 w-4" />
              Download current file
            </Link>
          ) : null}
        </div>
      ) : null}

      {["project", "experiment"].includes(kind) ? (
        <label>
          <span className="text-sm font-medium">Publication status</span>
          <select
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3"
          >
            <option value="ACTIVE">Active</option>
            <option value="PLANNED">Planned</option>
            <option value="COMPLETED">Completed</option>
            <option value="MAINTAINED">Maintained</option>
          </select>
        </label>
      ) : null}

      {textFields[kind].map((field) =>
        longFields.has(field) ? (
          <MarkdownEditor
            key={field}
            label={labelFor(field)}
            value={fieldValues[field] ?? ""}
            onChange={(v) => setFieldValues((current) => ({ ...current, [field]: v }))}
            required={!["embedUrl", "imageUrl", "url", "issuedAt"].includes(field)}
          />
        ) : (
          <label key={field}>
            <span className="text-sm font-medium">{labelFor(field)}</span>
            <textarea
              value={fieldValues[field] ?? ""}
              onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
              required={!["embedUrl", "imageUrl", "url", "issuedAt", "startDate", "endDate"].includes(field)}
              rows={2}
              className="mt-2 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-cobalt-500"
            />
          </label>
        )
      )}

      {kind === "project" ? (
        <label>
          <span className="text-sm font-medium">Tech stack, comma separated</span>
          <input
            value={techStack}
            onChange={(event) => setTechStack(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
          />
        </label>
      ) : null}

      {!["site-profile", "skill", "certification", "timeline", "document"].includes(kind) ? (
        <label>
          <span className="text-sm font-medium">Tags, comma separated</span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
          />
        </label>
      ) : null}

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {message ? <p className="text-sm text-[var(--muted)]" aria-live="polite">{message}</p> : <p className="text-sm text-[var(--muted)]">No unsaved changes.</p>}
        {hasUnsavedChanges ? (
          <button
            type="submit"
            disabled={saving}
            className="h-11 w-full rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-60 sm:w-auto dark:bg-ink-50 dark:text-ink-950"
          >
            {saving ? "Saving..." : "Save editable content"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
