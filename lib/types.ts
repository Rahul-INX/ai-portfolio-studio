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
  id?: string;
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
  id?: string;
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
  id?: string;
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
  id?: string;
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
  id?: string;
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
  id?: string;
  title: string;
  period: string;
  description: string;
  signal: string;
  sortOrder: number;
};

export type SkillSignal = {
  id?: string;
  name: string;
  category: string;
  level: number;
  weight: number;
};

export type CertificationSignal = {
  id?: string;
  title: string;
  issuer: string;
  issuedAt?: Date | string | null;
  url?: string | null;
};

export type AchievementSignal = {
  id?: string;
  title: string;
  issuer: string;
  category: string;
  summary: string;
  awardedAt?: Date | string | null;
  proofUrl?: string | null;
  imageUrl?: string | null;
  imageRatio: "1/1" | "4/3" | "16/9";
  imageFocus?: string | null;
  highlighted: boolean;
  sortOrder: number;
  publishedAt?: Date | string | null;
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
  githubUrl?: string | null;
  linkedinUrl?: string | null;
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
  homeLatestEyebrow: string;
  awardsEyebrow: string;
  awardsTitle: string;
  awardsDescription: string;
  homeSystemsEyebrow: string;
  homeSystemsTitle: string;
  homeSystemsDescription: string;
  resumeDownloadsEyebrow: string;
  resumeDownloadsTitle: string;
  resumeDownloadsDescription: string;
  downloadResumeLabel: string;
  downloadCvLabel: string;
  viewCvLabel: string;
  contactCtaLabel: string;
  skillsTitle: string;
  certificationsTitle: string;
  cvHeadingEyebrow: string;
  cvSummaryTitle: string;
  cvProjectsTitle: string;
  cvExperienceTitle: string;
  cvCertificationsTitle: string;
  navExplorerLabel: string;
  navExperienceLabel: string;
  navResumeLabel: string;
  navJobFitLabel: string;
  adminCmsLabel: string;
  jobFitEyebrow: string;
  jobFitTitle: string;
  jobFitDescription: string;
  jobFitOutputTitle: string;
  jobFitOutputDescription: string;
  jobFitCriteriaEyebrow: string;
  jobFitCriteriaTitle: string;
  jobFitEvidenceEyebrow: string;
  jobFitEvidenceTitle: string;
  jobFitGapTitle: string;
  jobFitProbeTitle: string;
  jobFitMethodologyTitle: string;
  jobFitBuildTitle: string;
  jobFitBuildDescription: string;
  jobFitTemplateTitle: string;
  jobFitTemplateDescription: string;
  jobFitFormTitle: string;
  jobFitPasteLabel: string;
  jobFitAttachLabel: string;
  jobFitAttachHelp: string;
  jobFitEphemeralLabel: string;
  jobFitGenerateLabel: string;
  jobFitRegenerateLabel: string;
  jobFitEditLabel: string;
  jobFitCloseLabel: string;
  jobFitRunningLabel: string;
  jobFitFinalizingLabel: string;
  jobFitLoadingTitle: string;
  jobFitLoadingEyebrow: string;
  jobFitLoadingDescription: string;
  jobFitStatScoreLabel: string;
  jobFitStatRubricLabel: string;
  jobFitStatEvidenceLabel: string;
  jobFitStrengthsTitle: string;
  jobFitRisksTitle: string;
  jobFitNextStepTitle: string;
  jobFitRequirementLabel: string;
  jobFitPriorityLabel: string;
  jobFitEvidenceColumnLabel: string;
  jobFitScoreLabel: string;
  jobFitShowAllLabel: string;
  jobFitCitedSourceLabel: string;
  jobFitNoEvidenceLabel: string;
  jobFitNoGapLabel: string;
  jobFitProceedStrongLabel: string;
  jobFitProceedFocusLabel: string;
  jobFitProceedCautionLabel: string;
  jobFitProceedInsufficientLabel: string;
  jobFitSpecialistAnalysisLabel: string;
  jobFitDeterministicAnalysisLabel: string;
  jobFitAlignedCriteriaLabel: string;
  jobFitNeedValidationLabel: string;
  jobFitCitedSourcesLabel: string;
  timelineEyebrow: string;
  timelineTitle: string;
  timelineDescription: string;
  adminEyebrow: string;
  adminTitle: string;
  adminDescription: string;
  seoTitle: string;
  seoDescription: string;
  ogTopLabel: string;
  ogCenterLabel: string;
  ogFooterLabel: string;
};
