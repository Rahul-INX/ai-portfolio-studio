export type ContentKind = "project" | "case-study" | "experiment" | "blog" | "dashboard";

export type Metric = {
  label: string;
  value: string;
  accent?: boolean;
};

export type ArchitectureCanvas = {
  layers: string[];
  principles: string[];
  riskControls: string[];
};

export type SafeProject = {
  kind: "project";
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "MAINTAINED";
  techStack: string[];
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  metrics: Metric[];
  businessImpact: string;
  architectureCanvas: ArchitectureCanvas;
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  publishedAt?: string;
};

export type SafeCaseStudy = {
  kind: "case-study";
  slug: string;
  title: string;
  summary: string;
  problem: string;
  context: string;
  approach: string;
  businessValue: string;
  tags: string[];
  imageUrl?: string;
  publishedAt?: string;
};

export type SafeExperiment = {
  kind: "experiment";
  slug: string;
  title: string;
  summary: string;
  hypothesis: string;
  method: string;
  findings: string;
  nextStep: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "MAINTAINED";
  tags: string[];
  metrics: Metric[];
  imageUrl?: string;
  publishedAt?: string;
};

export type SafeBlog = {
  kind: "blog";
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  readTime: number;
  seoTitle: string;
  seoSummary: string;
  imageUrl?: string;
  publishedAt?: string;
};

export type SafeDashboard = {
  kind: "dashboard";
  slug: string;
  title: string;
  summary: string;
  embedUrl?: string;
  imageUrl?: string;
  tags: string[];
  publishedAt?: string;
};

export type ExplorerItem = SafeProject | SafeCaseStudy | SafeExperiment | SafeBlog | SafeDashboard;

export type TimelineItem = {
  title: string;
  period: string;
  description: string;
  signal: string;
  sortOrder: number;
};

export type SkillSignal = {
  name: string;
  category: string;
  level: number;
  weight: number;
};

export type CertificationSignal = {
  title: string;
  issuer: string;
  issuedAt?: Date | string | null;
  url?: string | null;
};

export type PortfolioDocumentKind = "RESUME" | "CV";

export type PortfolioDocument = {
  id?: string;
  kind: PortfolioDocumentKind;
  title: string;
  description: string;
  fileUrl: string;
  versionLabel?: string | null;
  publishedAt?: Date | string | null;
};

export type SiteProfile = {
  id: string;
  name: string;
  initials: string;
  role: string;
  profileImageUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactLocation?: string | null;
  heroEyebrow: string;
  heroTitle: string;
  heroSummary: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  focusLabel: string;
  focusValue: string;
  styleLabel: string;
  styleValue: string;
  modelLabel: string;
  modelValue: string;
  explorerEyebrow: string;
  explorerTitle: string;
  explorerDescription: string;
  timelineEyebrow: string;
  timelineTitle: string;
  timelineDescription: string;
  adminEyebrow: string;
  adminTitle: string;
  adminDescription: string;
  seoTitle: string;
  seoDescription: string;
};
