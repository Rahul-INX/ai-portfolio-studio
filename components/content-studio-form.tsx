"use client";

import Link from "next/link";
import { Download, ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MarkdownEditor } from "@/components/markdown-editor";
import { PortfolioSafetyReview } from "@/components/portfolio-safety-review";
import { uploadPortfolioMedia } from "@/lib/media-upload";
import { ProfileImageCropper } from "@/components/profile-image-cropper";
import { readApiResponse } from "@/lib/api-response";
import { resolvePortfolioMedia } from "@/lib/media";
import type {
  AchievementSignal,
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
  | "achievement"
  | "timeline"
  | "document";

type EditableRecord = Record<string, unknown> & {
  id?: string;
  kind?: EditableKind;
  title?: string;
  slug?: string;
  name?: string;
  documentKind?: string;
  visibility?: string;
};

type StudioData = {
  profile: SiteProfile;
  projects: SafeProject[];
  caseStudies: SafeCaseStudy[];
  experiments: SafeExperiment[];
  blogs: SafeBlog[];
  dashboards: SafeDashboard[];
  skills: SkillSignal[];
  certifications: CertificationSignal[];
  achievements: AchievementSignal[];
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
  achievement: "Achievement",
  timeline: "Timeline Event",
  document: "Document"
};

const visibilityKinds = new Set<EditableKind>([
  "project",
  "case-study",
  "experiment",
  "blog",
  "dashboard",
  "achievement",
  "document",
]);

const textFields: Record<EditableKind, string[]> = {
  "site-profile": [
    "name",
    "initials",
    "role",
    "profileImageUrl",
    "contactEmail",
    "contactPhone",
    "contactLocation",
    "githubUrl",
    "linkedinUrl",
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
    "homeLatestEyebrow",
    "awardsEyebrow",
    "awardsTitle",
    "awardsDescription",
    "homeSystemsEyebrow",
    "homeSystemsTitle",
    "homeSystemsDescription",
    "resumeDownloadsEyebrow",
    "resumeDownloadsTitle",
    "resumeDownloadsDescription",
    "downloadResumeLabel",
    "downloadCvLabel",
    "viewCvLabel",
    "contactCtaLabel",
    "skillsTitle",
    "certificationsTitle",
    "cvHeadingEyebrow",
    "cvSummaryTitle",
    "cvProjectsTitle",
    "cvExperienceTitle",
    "cvCertificationsTitle",
    "navExplorerLabel",
    "navExperienceLabel",
    "navResumeLabel",
    "navJobFitLabel",
    "adminCmsLabel",
    "jobFitEyebrow",
    "jobFitTitle",
    "jobFitDescription",
    "jobFitOutputTitle",
    "jobFitOutputDescription",
    "jobFitCriteriaEyebrow",
    "jobFitCriteriaTitle",
    "jobFitEvidenceEyebrow",
    "jobFitEvidenceTitle",
    "jobFitGapTitle",
    "jobFitProbeTitle",
    "jobFitMethodologyTitle",
    "jobFitBuildTitle",
    "jobFitBuildDescription",
    "jobFitTemplateTitle",
    "jobFitTemplateDescription",
    "jobFitFormTitle",
    "jobFitPasteLabel",
    "jobFitAttachLabel",
    "jobFitAttachHelp",
    "jobFitEphemeralLabel",
    "jobFitGenerateLabel",
    "jobFitRegenerateLabel",
    "jobFitEditLabel",
    "jobFitCloseLabel",
    "jobFitRunningLabel",
    "jobFitFinalizingLabel",
    "jobFitLoadingTitle",
    "jobFitLoadingEyebrow",
    "jobFitLoadingDescription",
    "jobFitStatScoreLabel",
    "jobFitStatRubricLabel",
    "jobFitStatEvidenceLabel",
    "jobFitStrengthsTitle",
    "jobFitRisksTitle",
    "jobFitNextStepTitle",
    "jobFitRequirementLabel",
    "jobFitPriorityLabel",
    "jobFitEvidenceColumnLabel",
    "jobFitScoreLabel",
    "jobFitShowAllLabel",
    "jobFitCitedSourceLabel",
    "jobFitNoEvidenceLabel",
    "jobFitNoGapLabel",
    "jobFitProceedStrongLabel",
    "jobFitProceedFocusLabel",
    "jobFitProceedCautionLabel",
    "jobFitProceedInsufficientLabel",
    "jobFitSpecialistAnalysisLabel",
    "jobFitDeterministicAnalysisLabel",
    "jobFitAlignedCriteriaLabel",
    "jobFitNeedValidationLabel",
    "jobFitCitedSourcesLabel",
    "timelineEyebrow",
    "timelineTitle",
    "timelineDescription",
    "adminEyebrow",
    "adminTitle",
    "adminDescription",
    "seoTitle",
    "seoDescription",
    "ogTopLabel",
    "ogCenterLabel",
    "ogFooterLabel"
  ],
  project: ["subtitle", "summary", "description", "businessImpact", "githubUrl", "demoUrl", "featured", "metricsJson", "architectureCanvasJson", "imageUrl", "startDate", "endDate"],
  "case-study": ["summary", "problem", "context", "approach", "businessValue", "imageUrl"],
  experiment: ["summary", "hypothesis", "method", "findings", "nextStep", "metricsJson", "imageUrl"],
  blog: ["excerpt", "content", "seoTitle", "seoSummary", "imageUrl"],
  dashboard: ["summary", "embedUrl", "imageUrl"],
  skill: ["category", "level", "weight"],
  certification: ["issuer", "issuedAt", "url"],
  achievement: ["issuer", "category", "summary", "awardedAt", "proofUrl", "imageUrl", "imageRatio", "highlighted", "sortOrder"],
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
  "summary",
  "hypothesis",
  "method",
  "findings",
  "nextStep",
  "content"
]);

const coreProfileFields = new Set([
  "name", "initials", "role", "profileImageUrl", "contactEmail", "contactPhone", "contactLocation", "githubUrl", "linkedinUrl",
  "heroEyebrow", "heroTitle", "heroSummary", "primaryCtaLabel", "secondaryCtaLabel",
  "focusLabel", "focusValue", "styleLabel", "styleValue", "modelLabel", "modelValue",
  "homeSystemsEyebrow", "homeSystemsTitle", "homeSystemsDescription"
]);

type MetricRow = { label: string; value: string; accent?: boolean };
type ArchitectureCanvasValue = { layers: string[]; principles: string[]; riskControls: string[] };

async function uploadDocument(file: File): Promise<string | null> {
  return uploadPortfolioMedia(file, "supporting", "/api/document-upload");
}

async function uploadImage(file: File, kind: EditableKind): Promise<string | null> {
  const folder = kind === "project" ? "projects" : kind === "case-study" ? "case-studies" : kind === "experiment" ? "experiments" : kind === "blog" ? "blogs" : kind === "dashboard" ? "dashboards" : kind === "achievement" ? "achievements" : "profile";
  return uploadPortfolioMedia(file, folder, "/api/media");
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

function jsonValue(value: unknown, fallback: unknown) {
  return JSON.stringify(value ?? fallback, null, 2);
}

function parseJsonField<T>(value: string | undefined, fallback: T): T {
  if (!value?.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function MetricsEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const metrics = parseJsonField<MetricRow[]>(value, []);
  const update = (next: MetricRow[]) => onChange(jsonValue(next, []));

  return (
    <section className="rounded-lg border hairline bg-[var(--panel-strong)] p-4 md:col-span-2" aria-labelledby="metrics-editor-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="metrics-editor-title" className="text-sm font-semibold">Metrics</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Add compact proof points shown on the project card. No JSON required.</p>
        </div>
        <button type="button" onClick={() => update([...metrics, { label: "", value: "", accent: false }])} className="inline-flex h-9 items-center gap-2 rounded-md border hairline px-3 text-xs font-semibold hover:border-cobalt-500">
          <Plus aria-hidden className="h-3.5 w-3.5" /> Add metric
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="grid gap-3 rounded-md border hairline bg-[var(--panel)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
            <label><span className="text-xs font-medium text-[var(--muted)]">Label</span><input value={metric.label} onChange={(event) => update(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} className="mt-1.5 h-10 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label>
            <label><span className="text-xs font-medium text-[var(--muted)]">Value</span><input value={metric.value} onChange={(event) => update(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} className="mt-1.5 h-10 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" /></label>
            <label className="flex h-10 items-center gap-2 text-xs font-medium"><input type="checkbox" checked={Boolean(metric.accent)} onChange={(event) => update(metrics.map((item, itemIndex) => itemIndex === index ? { ...item, accent: event.target.checked } : item))} className="h-4 w-4 accent-cobalt-600" /> Highlight</label>
            <button type="button" aria-label={`Remove metric ${index + 1}`} onClick={() => update(metrics.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-md border hairline text-[var(--muted)] hover:border-rose-400 hover:text-rose-600"><Trash2 aria-hidden className="h-4 w-4" /></button>
          </div>
        ))}
        {!metrics.length ? <p className="rounded-md border border-dashed hairline p-4 text-sm text-[var(--muted)]">No metrics added.</p> : null}
      </div>
    </section>
  );
}

function ArchitectureEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvas = parseJsonField<ArchitectureCanvasValue>(value, { layers: [], principles: [], riskControls: [] });
  const groups: Array<{ key: keyof ArchitectureCanvasValue; label: string; help: string }> = [
    { key: "layers", label: "System layers", help: "Major stages or components in execution order." },
    { key: "principles", label: "Design principles", help: "Rules that guided implementation decisions." },
    { key: "riskControls", label: "Risk controls", help: "Checks that reduce operational or model risk." }
  ];
  const updateGroup = (key: keyof ArchitectureCanvasValue, values: string[]) => onChange(jsonValue({ ...canvas, [key]: values }, canvas));

  return (
    <fieldset className="rounded-lg border hairline bg-[var(--panel-strong)] p-4 md:col-span-2">
      <legend className="text-sm font-semibold">Architecture canvas</legend>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Describe the system in structured lists. The stored object shape remains unchanged.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.key} className="rounded-md border hairline bg-[var(--panel)] p-3">
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <p className="mt-1 min-h-10 text-xs leading-5 text-[var(--muted)]">{group.help}</p>
            <div className="mt-3 space-y-2">
              {canvas[group.key].map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input value={item} aria-label={`${group.label} item ${index + 1}`} onChange={(event) => updateGroup(group.key, canvas[group.key].map((entry, itemIndex) => itemIndex === index ? event.target.value : entry))} className="h-10 min-w-0 flex-1 rounded-md border hairline bg-[var(--panel-strong)] px-3 text-sm" />
                  <button type="button" aria-label={`Remove ${group.label} item ${index + 1}`} onClick={() => updateGroup(group.key, canvas[group.key].filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-md border hairline text-[var(--muted)] hover:border-rose-400 hover:text-rose-600"><Trash2 aria-hidden className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => updateGroup(group.key, [...canvas[group.key], ""])} className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border hairline px-3 text-xs font-semibold hover:border-cobalt-500"><Plus aria-hidden className="h-3.5 w-3.5" /> Add item</button>
          </section>
        ))}
      </div>
    </fieldset>
  );
}

function labelFor(field: string) {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .replace("Seo", "SEO");
}

function recordKey(record: EditableRecord, index: number) {
  return String(record.id ?? record.slug ?? record.name ?? record.title ?? index);
}

function recordMatchesSelection(record: EditableRecord, index: number, key: string) {
  const candidates = [
    record.id,
    record.slug,
    record.name,
    record.title,
    record.kind === "document" ? record.documentKind : undefined,
    String(index)
  ]
    .filter((value): value is string => Boolean(value))
    .map(String);

  return candidates.includes(key);
}

function findRecordBySelection(records: EditableRecord[], key: string) {
  return records.find((item, index) => recordMatchesSelection(item, index, key));
}

export function ContentStudioForm({ data }: { data: StudioData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [kind, setKind] = useState<EditableKind>("site-profile");
  const [selectedKey, setSelectedKey] = useState("main");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [techStack, setTechStack] = useState("");
  const [statusValue, setStatusValue] = useState("ACTIVE");
  const [visibilityValue, setVisibilityValue] = useState("PUBLISHED");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => profileValues(data.profile));
  const [message, setMessage] = useState("");
  const [savedSignature, setSavedSignature] = useState(() =>
    signatureFor("site-profile", "", "", "", "", "ACTIVE", "PUBLISHED", profileValues(data.profile))
  );
  const [saving, setSaving] = useState(false);
  const [fieldFilter, setFieldFilter] = useState("");
  const [showAllProfileFields, setShowAllProfileFields] = useState(false);

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
      achievement: data.achievements.map((item) => ({ ...item, kind: "achievement" })),
      timeline: data.timeline.map((item) => ({ ...item, kind: "timeline" })),
      document: data.documents.map((item) => ({ ...item, id: item.kind, documentKind: item.kind, kind: "document", title: item.title }))
    }),
    [data]
  );

  const selectedRecords = records[kind];
  const visibleFields = textFields[kind].filter((field) => {
    const matchesFilter = !fieldFilter || labelFor(field).toLowerCase().includes(fieldFilter.toLowerCase());
    return matchesFilter && (kind !== "site-profile" || Boolean(fieldFilter) || showAllProfileFields || coreProfileFields.has(field));
  });

  function profileValues(profile: SiteProfile) {
    return Object.fromEntries(textFields["site-profile"].map((field) => [field, String(profile[field as keyof SiteProfile] ?? "")]));
  }

  function loadRecord(nextKind: EditableKind, key: string) {
    const record = findRecordBySelection(records[nextKind], key);
    setMessage("");
    setSelectedKey(record ? recordKey(record, records[nextKind].indexOf(record)) : key);
    if (!record) {
      setTitle("");
      setSlug("");
      setTags("");
      setTechStack("");
      setStatusValue("ACTIVE");
      setVisibilityValue("PUBLISHED");
      const emptyValues = Object.fromEntries(textFields[nextKind].map((field) => [field, ""]));
      setFieldValues(emptyValues);
      setSavedSignature(signatureFor(nextKind, "", "", "", "", "ACTIVE", "PUBLISHED", emptyValues));
      return;
    }
    const nextValues = Object.fromEntries(
      textFields[nextKind].map((field) => {
        const value =
          field === "metricsJson"
            ? jsonValue(record.metrics, [])
            : field === "architectureCanvasJson"
              ? jsonValue(record.architectureCanvas, { layers: [], principles: [], riskControls: [] })
              : ["issuedAt", "awardedAt", "startDate", "endDate"].includes(field)
                ? dateValue(record[field])
                : String(record[field] ?? "");
        return [field, value];
      })
    );
    setTitle(String(record.title ?? record.name ?? ""));
    setSlug(String(record.slug ?? ""));
    setTags(listValue(record.tags));
    setTechStack(listValue(record.techStack));
    setStatusValue(String(record.status ?? "ACTIVE"));
    setVisibilityValue(String(record.visibility ?? "PUBLISHED"));
    setFieldValues(nextValues);
    setSavedSignature(
      signatureFor(
        nextKind,
        String(record.title ?? record.name ?? ""),
        String(record.slug ?? ""),
        listValue(record.tags),
        listValue(record.techStack),
        String(record.status ?? "ACTIVE"),
        String(record.visibility ?? "PUBLISHED"),
        nextValues
      )
    );
  }

  function changeKind(nextKind: EditableKind) {
    setKind(nextKind);
    setFieldFilter("");
    setShowAllProfileFields(false);
    const firstKey = nextKind === "site-profile" ? "main" : nextKind === "document" ? "RESUME" : "new";
    loadRecord(nextKind, firstKey);
  }

  useEffect(() => {
    const requestedKind = searchParams.get("kind") as EditableKind | null;
    const requestedRecord = searchParams.get("record");
    if (!requestedKind || !(requestedKind in kindLabels) || !requestedRecord) return;
    const timer = window.setTimeout(() => {
      setKind(requestedKind);
      loadRecord(requestedKind, requestedRecord);
    }, 0);
    return () => window.clearTimeout(timer);
    // Query parameters are only an initial contextual entry point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function recordLabel(record: EditableRecord) {
    const label = String(record.title ?? record.name ?? record.slug ?? "Untitled");
    return record.visibility && record.visibility !== "PUBLISHED"
      ? `${label} · ${String(record.visibility).toLowerCase()}`
      : label;
  }

  function signatureFor(
    nextKind: EditableKind,
    nextTitle: string,
    nextSlug: string,
    nextTags: string,
    nextTechStack: string,
    nextStatus: string,
    nextVisibility: string,
    nextFields: Record<string, string>
  ) {
    return JSON.stringify({
      kind: nextKind,
      title: nextTitle,
      slug: nextSlug,
      tags: nextTags,
      techStack: nextTechStack,
      status: nextStatus,
      visibility: nextVisibility,
      fields: nextFields
    });
  }

  const currentSignature = signatureFor(kind, title, slug, tags, techStack, statusValue, visibilityValue, fieldValues);
  const hasUnsavedChanges = currentSignature !== savedSignature;

  async function publishProfileImage(profileImageUrl: string) {
    const nextFields = { ...fieldValues, profileImageUrl };
    setFieldValues(nextFields);
    setSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "site-profile", ...nextFields })
      });
      await readApiResponse(response);
      setSavedSignature(signatureFor("site-profile", title, slug, tags, techStack, statusValue, visibilityValue, nextFields));
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Saving changes...");
    const selected = findRecordBySelection(selectedRecords, selectedKey);
    const common = {
      id: selectedKey !== "new" ? selected?.id : undefined,
      kind,
      title,
      slug: slug || slugify(title),
      tags: splitList(tags),
      visibility: visibilityValue
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
              githubUrl: fieldValues.githubUrl,
              demoUrl: fieldValues.demoUrl,
              featured: fieldValues.featured === "true",
              imageUrl: fieldValues.imageUrl,
              startDate: fieldValues.startDate,
              endDate: fieldValues.endDate,
              status: statusValue,
              techStack: splitList(techStack),
              metrics: parseJsonField(fieldValues.metricsJson, selected?.metrics ?? [{ label: "Portfolio signal", value: "Editable", accent: true }]),
              architectureCanvas: parseJsonField(fieldValues.architectureCanvasJson, selected?.architectureCanvas ?? {
                layers: ["Source", "Processing", "Presentation"],
                principles: ["Evidence first", "Admin editable"],
                riskControls: ["Public-safe wording", "Human review"]
              })
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
                  metrics: parseJsonField(fieldValues.metricsJson, selected?.metrics ?? [{ label: "Experiment", value: "Editable", accent: true }])
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
                        : kind === "achievement"
                          ? {
                              kind,
                              id: selected?.id,
                              title,
                              issuer: fieldValues.issuer,
                              category: fieldValues.category,
                              summary: fieldValues.summary,
                              awardedAt: fieldValues.awardedAt,
                              proofUrl: fieldValues.proofUrl,
                              imageUrl: fieldValues.imageUrl,
                              imageRatio: fieldValues.imageRatio || "4/3",
                              highlighted: fieldValues.highlighted === "true",
                              sortOrder: Number(fieldValues.sortOrder || 0),
                              visibility: visibilityValue
                            }
                          : kind === "document"
                            ? {
                                kind,
                                documentKind: String(selected?.documentKind ?? selected?.kind ?? selectedKey) === "CV" ? "CV" : "RESUME",
                                title,
                                description: fieldValues.description,
                              fileUrl: fieldValues.fileUrl,
                              versionLabel: fieldValues.versionLabel,
                              visibility: visibilityValue
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
      await readApiResponse(response);
      setSavedSignature(currentSignature);
      setMessage(
        visibilityKinds.has(kind) && visibilityValue !== "PUBLISHED"
          ? `Saved as ${visibilityValue.toLowerCase()}. It is hidden from public pages.`
          : "Saved and published. Public pages now use the latest database content.",
      );
      router.refresh();
    } catch (error) {
      setMessage(
        `Save failed: ${error instanceof Error ? error.message : "The server could not be reached."}`,
      );
    } finally {
      setSaving(false);
    }
  }

  function applySafetyDraft(draft: { title: string; summary: string; tags: string[] }) {
    setTitle(draft.title);
    if (!slug) setSlug(slugify(draft.title));
    setTags(draft.tags.join(", "));
    const summaryField = kind === "blog" ? "excerpt" : "summary";
    setFieldValues((current) => ({
      ...current,
      [summaryField]: draft.summary,
      ...(kind === "blog" && !current.content ? { content: `## Overview\n\n${draft.summary}` } : {}),
    }));
    setMessage("Safety-reviewed draft applied. Edit it, verify every claim, then save when ready.");
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
          {!["skill", "certification", "achievement", "timeline", "document"].includes(kind) ? (
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
                try {
                  const url = await uploadDocument(file);
                  setMessage(url ? "Document uploaded. Save editable content to publish it." : "Document upload failed.");
                  if (url) setFieldValues((current) => ({ ...current, fileUrl: url }));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Document upload failed.");
                }
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

      {visibilityKinds.has(kind) ? (
        <label>
          <span className="text-sm font-medium">Visibility</span>
          <select
            value={visibilityValue}
            onChange={(event) => setVisibilityValue(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3"
          >
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      ) : null}

      {(["project", "case-study", "experiment", "blog", "dashboard"] as EditableKind[]).includes(kind) ? (
        <PortfolioSafetyReview
          kind={kind as "project" | "case-study" | "experiment" | "blog" | "dashboard"}
          onApply={applySafetyDraft}
        />
      ) : null}

      {textFields[kind].length > 12 ? (
        <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border hairline bg-[var(--panel-strong)] p-3">
          <label className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Find a field</span>
            <input value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)} placeholder="Search labels, SEO, job fit..." className="mt-1.5 h-10 w-full rounded-md border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-[var(--accent)]" />
          </label>
          {kind === "site-profile" && !showAllProfileFields ? (
            <button type="button" onClick={() => setShowAllProfileFields(true)} className="h-10 rounded-md border hairline px-3 text-sm font-semibold transition hover:border-[var(--accent)]">Show all page labels</button>
          ) : null}
          {kind === "site-profile" && showAllProfileFields ? (
            <button type="button" onClick={() => setShowAllProfileFields(false)} className="h-10 rounded-md border hairline px-3 text-sm font-semibold transition hover:border-[var(--accent)]">Core profile only</button>
          ) : null}
          <p className="text-xs text-[var(--muted)]">{visibleFields.length} fields shown</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {visibleFields.map((field) =>
          field === "profileImageUrl" ? (
            <ProfileImageCropper
              key={field}
              value={fieldValues[field] ?? ""}
              onChange={publishProfileImage}
              onMessage={setMessage}
            />
          ) : field === "metricsJson" ? (
            <MetricsEditor
              key={field}
              value={fieldValues[field] ?? "[]"}
              onChange={(value) => setFieldValues((current) => ({ ...current, [field]: value }))}
            />
          ) : field === "architectureCanvasJson" ? (
            <ArchitectureEditor
              key={field}
              value={fieldValues[field] ?? ""}
              onChange={(value) => setFieldValues((current) => ({ ...current, [field]: value }))}
            />
          ) : ["featured", "highlighted"].includes(field) ? (
            <label key={field} className="flex items-center justify-between gap-4 rounded-lg border hairline bg-[var(--panel-strong)] p-4">
              <span>
                <span className="block text-sm font-semibold">{field === "featured" ? "Featured project" : "Highlight achievement"}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  {field === "featured" ? "Promote this project in selected-work surfaces." : "Promote this achievement in the landing-page credibility section."}
                </span>
              </span>
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={fieldValues[field] === "true"}
                  onChange={(event) => setFieldValues((current) => ({ ...current, [field]: String(event.target.checked) }))}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-[var(--line)] transition peer-checked:bg-cobalt-600 peer-focus-visible:ring-2 peer-focus-visible:ring-cobalt-500 peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
              </span>
            </label>
          ) : ["startDate", "endDate", "issuedAt", "awardedAt"].includes(field) ? (
            <label key={field}>
              <span className="text-sm font-medium">{labelFor(field)}</span>
              <input
                type="date"
                value={fieldValues[field] ?? ""}
                onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
              />
            </label>
          ) : ["level", "weight", "sortOrder"].includes(field) ? (
            <label key={field}>
              <span className="text-sm font-medium">{labelFor(field)}</span>
              {field === "weight" && kind === "skill" ? (
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  Used by the Job Fit AI (1-10) to know how core this skill is to your identity. Higher weight = prioritized in evaluation.
                </span>
              ) : field === "level" && kind === "skill" ? (
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                  Controls the visual width of the blue progress bar on the public timeline page (0-100).
                </span>
              ) : null}
              <input
                type="number"
                min={field === "sortOrder" ? 0 : 1}
                max={field === "level" ? 100 : field === "weight" ? 10 : undefined}
                value={fieldValues[field] ?? ""}
                onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
              />
            </label>
          ) : ["githubUrl", "demoUrl", "embedUrl", "url", "proofUrl"].includes(field) ? (
            <label key={field}>
              <span className="text-sm font-medium">{labelFor(field)}</span>
              <input
                type="url"
                inputMode="url"
                placeholder="https://"
                value={fieldValues[field] ?? ""}
                onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 outline-none focus:border-cobalt-500"
              />
            </label>
          ) : field === "imageRatio" ? (
            <label key={field}>
              <span className="text-sm font-medium">Image ratio</span>
              <select
                value={fieldValues[field] || "4/3"}
                onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
                className="mt-2 h-11 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3"
              >
                <option value="4/3">4:3 balanced card</option>
                <option value="16/9">16:9 wide certificate</option>
                <option value="1/1">1:1 square badge</option>
              </select>
            </label>
          ) : field === "imageUrl" ? (
          <div key={field} className="overflow-hidden rounded-md border hairline bg-[var(--panel-strong)] md:col-span-2">
            <div className="grid gap-4 p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
              <div className={`relative overflow-hidden rounded-md border-2 border-[var(--line-strong)] bg-[var(--panel)] ${fieldValues.imageRatio === "16/9" ? "aspect-video" : fieldValues.imageRatio === "1/1" ? "aspect-square" : "aspect-[4/3]"}`}>
                {fieldValues[field] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvePortfolioMedia(fieldValues[field])}
                    alt={`${labelFor(field)} preview`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[var(--muted)]">
                    <ImageIcon aria-hidden className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{labelFor(field)}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Upload an image or replace its source.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-ink-900 px-4 text-sm font-medium text-white transition hover:bg-cobalt-600 dark:bg-ink-50 dark:text-ink-950">
                    <Upload aria-hidden className="h-4 w-4" />
                    Upload image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="sr-only"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        setMessage("Uploading image...");
                        try {
                          const url = await uploadImage(file, kind);
                          setMessage(url ? "Image uploaded. Save to publish it." : "Image upload failed.");
                          if (url) setFieldValues((current) => ({ ...current, [field]: url }));
                        } catch (error) {
                          setMessage(error instanceof Error ? error.message : "Image upload failed.");
                        }
                      }}
                    />
                  </label>
                  {fieldValues[field] ? (
                    <button
                      type="button"
                      onClick={() => setFieldValues((current) => ({ ...current, [field]: "" }))}
                      className="h-10 rounded-md border hairline px-4 text-sm font-medium transition hover:border-cobalt-500"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--muted)]">Use an image URL instead</summary>
                  <input
                    value={fieldValues[field] ?? ""}
                    onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder="https://... or /api/files/..."
                    className="mt-2 h-10 w-full rounded-md border hairline bg-[var(--panel)] px-3 text-sm outline-none focus:border-cobalt-500"
                  />
                </details>
              </div>
            </div>
          </div>
          ) : longFields.has(field) ? (
          <div key={field} className="md:col-span-2">
            <MarkdownEditor
              label={labelFor(field)}
              value={fieldValues[field] ?? ""}
              onChange={(v) => setFieldValues((current) => ({ ...current, [field]: v }))}
              required={!["embedUrl", "imageUrl", "url", "issuedAt"].includes(field)}
            />
          </div>
        ) : (
          <label key={field}>
            <span className="text-sm font-medium">{labelFor(field)}</span>
            <textarea
              value={fieldValues[field] ?? ""}
              onChange={(event) => setFieldValues((current) => ({ ...current, [field]: event.target.value }))}
              required={!["embedUrl", "imageUrl", "url", "githubUrl", "demoUrl", "issuedAt", "startDate", "endDate"].includes(field)}
              rows={2}
              className="mt-2 w-full rounded-md border hairline bg-[var(--panel-strong)] px-3 py-2 outline-none focus:border-cobalt-500"
            />
          </label>
          )
        )}
      </div>

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

      {!["site-profile", "skill", "certification", "achievement", "timeline", "document"].includes(kind) ? (
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!["site-profile", "document"].includes(kind) && selectedKey !== "new" ? (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                const record = findRecordBySelection(selectedRecords, selectedKey);
                if (!record?.id) return;
                const confirmMessage = `Are you sure you want to delete this ${kindLabels[kind].toLowerCase()}? This action cannot be undone.`;
                if (!window.confirm(confirmMessage)) return;

                setSaving(true);
                setMessage("Deleting content...");
                try {
                  const response = await fetch("/api/content", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ kind, id: record.id })
                  });
                  await readApiResponse(response);
                  setMessage("Deleted successfully.");
                  loadRecord(kind, "new");
                  router.replace(`/admin/new-project?kind=${kind}&record=new`);
                  router.refresh();
                } catch (error) {
                  setMessage(
                    `Delete failed: ${error instanceof Error ? error.message : "The server could not be reached."}`
                  );
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-300 bg-transparent px-5 text-sm font-medium text-rose-600 transition hover:border-rose-400 hover:bg-rose-50/50 sm:w-auto dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/20"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
              Delete {kindLabels[kind].toLowerCase()}
            </button>
          ) : null}
          {hasUnsavedChanges ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => loadRecord(kind, selectedKey)}
                className="h-11 w-full rounded-md border hairline px-5 text-sm font-medium transition hover:border-cobalt-500 disabled:opacity-60 sm:w-auto"
              >
                Discard changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 w-full rounded-md bg-ink-900 px-5 text-sm font-medium text-white transition hover:bg-cobalt-600 disabled:opacity-60 sm:w-auto dark:bg-ink-50 dark:text-ink-950"
              >
                {saving ? "Saving..." : "Save editable content"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </form>
  );
}
