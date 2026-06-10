import type {
  ExplorerItem,
  AchievementSignal,
  SafeBlog,
  SafeCaseStudy,
  SafeDashboard,
  SafeExperiment,
  SafeProject,
  CertificationSignal,
  PortfolioDocument,
  SiteProfile,
  SkillSignal,
  TimelineItem
} from "@/lib/types";

export const safeSiteProfile: SiteProfile = {
  id: "main",
  name: "Rahul Harivansh Fatyal",
  initials: "RH",
  role: "GenAI Developer / Data Science Professional",
  profileImageUrl: "/media/rahul-profile.jpeg",
  contactEmail: "rahulharivanshfatyal@gmail.com",
  contactPhone: "+91 98050 70462",
  contactLocation: "Bilaspur, Himachal Pradesh, India",
  githubUrl: null,
  linkedinUrl: null,
  heroEyebrow: "GenAI Developer / Data Science Professional",
  heroTitle: "Building retrieval, automation, and data products that turn messy knowledge into decisions.",
  heroSummary:
    "A portfolio of applied RAG systems, resume intelligence, document question-answering, support automation, forecasting, and NLP work grounded in Python, FastAPI, vector search, LangChain, and human-in-the-loop review.",
  primaryCtaLabel: "Explore AI systems",
  secondaryCtaLabel: "View growth timeline",
  focusLabel: "Primary focus",
  focusValue: "RAG and agents",
  styleLabel: "Operating style",
  styleValue: "Evidence first",
  modelLabel: "CMS model",
  modelValue: "Admin editable",
  explorerEyebrow: "AI Systems Explorer",
  explorerTitle: "A searchable map of GenAI, data science, automation, and product evidence.",
  explorerDescription:
    "Built for technical reviewers who need quick proof first: project purpose, architecture, stack, signals, and public-safe tradeoffs.",
  homeLatestEyebrow: "Latest evidence",
  awardsEyebrow: "Awards and achievements",
  awardsTitle: "Editable proof signals that support the GenAI engineering story.",
  awardsDescription:
    "Awards, credentials, leadership signals, and milestone proof live on the page itself in edit mode, so you can update them where they are reviewed.",
  homeSystemsEyebrow: "Selected systems",
  homeSystemsTitle: "Systems with inspectable architecture, outcomes, and operating constraints.",
  homeSystemsDescription:
    "Systems Explorer prioritizes credible proof: the problem, the implementation boundary, measurable signals, and the decisions that make each system reviewable.",
  resumeDownloadsEyebrow: "Documents",
  resumeDownloadsTitle: "Resume & CV Downloads",
  resumeDownloadsDescription:
    "Recruiter-ready downloads and a detailed CV page with project, education, certification, and leadership evidence.",
  downloadResumeLabel: "Download Resume",
  downloadCvLabel: "Download CV",
  viewCvLabel: "View CV",
  contactCtaLabel: "Start a conversation",
  skillsTitle: "Skill Signals",
  certificationsTitle: "Certifications",
  cvHeadingEyebrow: "Detailed CV",
  cvSummaryTitle: "Professional Summary",
  cvProjectsTitle: "Selected Projects",
  cvExperienceTitle: "Experience",
  cvCertificationsTitle: "Certifications",
  navExplorerLabel: "Systems Explorer",
  navExperienceLabel: "Experience",
  navResumeLabel: "Resume",
  navJobFitLabel: "Check Job Fit",
  adminCmsLabel: "Admin CMS",
  jobFitEyebrow: "Recruiter Fit Review",
  jobFitTitle: "Role Fit Brief",
  jobFitDescription:
    "Paste or attach any job description to compare the role against Rahul's public portfolio evidence. The evaluator derives a rubric from that JD, names missing proof clearly, and avoids unverifiable claims.",
  jobFitOutputTitle: "A repeatable recruiter dashboard, not a black-box claim.",
  jobFitOutputDescription:
    "The brief returns overall fit, factor bars, requirement notes, relevant evidence with compact citations, gaps, interview probes, and fairness notes.",
  jobFitCriteriaEyebrow: "Criteria",
  jobFitCriteriaTitle: "The criteria most likely to change the hiring decision.",
  jobFitEvidenceEyebrow: "Evidence",
  jobFitEvidenceTitle: "Evidence Dashboard",
  jobFitGapTitle: "Gap Analysis",
  jobFitProbeTitle: "Interview Probes",
  jobFitMethodologyTitle: "Methodology and Unbiased Notes",
  jobFitBuildTitle: "Building the Role Fit Brief",
  jobFitBuildDescription: "The page measures fit using a rubric derived from the supplied JD and shows only public evidence that can be verified.",
  jobFitTemplateTitle: "Output Template",
  jobFitTemplateDescription: "The result panel stays explicit about what is proven, what is inferred, and what still needs human review.",
  jobFitFormTitle: "Job Description",
  jobFitPasteLabel: "Paste JD text",
  jobFitAttachLabel: "Attach JD file",
  jobFitAttachHelp: "Supports .txt, .pdf, and .docx up to 4 MB.",
  jobFitEphemeralLabel: "Ephemeral analysis only",
  jobFitGenerateLabel: "Generate Fit Brief",
  jobFitRegenerateLabel: "Regenerate Fit Brief",
  jobFitEditLabel: "Edit JD",
  jobFitCloseLabel: "Close editor",
  jobFitRunningLabel: "AI evidence analysis",
  jobFitFinalizingLabel: "Finalizing your evidence-backed results...",
  jobFitLoadingTitle: "Building the Role Fit Brief",
  jobFitLoadingEyebrow: "AI evidence analysis",
  jobFitLoadingDescription: "Generating results in up to a few moments...",
  jobFitStatScoreLabel: "Fit score",
  jobFitStatRubricLabel: "Rubric",
  jobFitStatEvidenceLabel: "Evidence",
  jobFitStrengthsTitle: "Proven strengths",
  jobFitRisksTitle: "Decision risks",
  jobFitNextStepTitle: "Recommended next step",
  jobFitRequirementLabel: "Requirement",
  jobFitPriorityLabel: "Priority",
  jobFitEvidenceColumnLabel: "Evidence",
  jobFitScoreLabel: "Score",
  jobFitShowAllLabel: "Show all",
  jobFitCitedSourceLabel: "cited source",
  jobFitNoEvidenceLabel: "No relevant public evidence found",
  jobFitNoGapLabel: "No material evidence gaps detected.",
  jobFitProceedStrongLabel: "Strong evidence to proceed",
  jobFitProceedFocusLabel: "Proceed to focused interview",
  jobFitProceedCautionLabel: "Proceed with caution",
  jobFitProceedInsufficientLabel: "Insufficient public evidence",
  jobFitSpecialistAnalysisLabel: "Specialist analysis",
  jobFitDeterministicAnalysisLabel: "Deterministic analysis",
  jobFitAlignedCriteriaLabel: "aligned criteria",
  jobFitNeedValidationLabel: "need validation",
  jobFitCitedSourcesLabel: "cited sources",
  timelineEyebrow: "Resume and Timeline",
  timelineTitle: "From computer science foundations to applied GenAI and data-product engineering.",
  timelineDescription:
    "A structured view of education, leadership, ML projects, RAG systems, and the current focus on production-minded AI tooling.",
  adminEyebrow: "Admin CMS",
  adminTitle: "Editable portfolio control center",
  adminDescription:
    "Manage profile copy, projects, case studies, experiments, blogs, dashboards, skills, certifications, and timeline records from the authenticated studio.",
  seoTitle: "Rahul Harivansh Fatyal | GenAI Developer and Data Science Portfolio",
  seoDescription:
    "GenAI and data science portfolio covering RAG, LangChain, vector search, support automation, resume matching, forecasting, NLP, and admin-editable CMS workflows.",
  ogTopLabel: "Projects / Evidence / Experience",
  ogCenterLabel: "Evidence-first portfolio",
  ogFooterLabel: "Recruiter-ready navigation / Editable CMS"
};

export const safeProjects: SafeProject[] = [
  {
    kind: "project",
    slug: "cognitut-knowledge-tutoring-system",
    title: "Cognitut Knowledge-Based Tutoring System",
    subtitle: "A local-knowledge tutoring platform using open-source LLMs, LangChain, and learning analytics.",
    summary:
      "Final-year GenAI project where students ask questions against syllabus/reference-book knowledge while future phases add cognitive analytics and Bloom's Taxonomy segmentation.",
    description:
      "Cognitut was built as an education-focused RAG assistant: reference material stays inside a controlled knowledge area, students ask questions interactively, and the product vision connects interaction analytics to personalized guidance and probable job-industry fit.",
    status: "ACTIVE",
    techStack: ["Python", "Streamlit", "LangChain", "Hugging Face", "Llama 2", "Mistral", "RAG"],
    tags: ["GenAI", "RAG", "Education", "Analytics"],
    metrics: [
      { label: "Phase", value: "I live", accent: true },
      { label: "Knowledge mode", value: "Local corpus" },
      { label: "Analytics plan", value: "Bloom taxonomy" }
    ],
    businessImpact:
      "Shows how GenAI can support students with bounded answers, personalized learning signals, and transparent knowledge constraints.",
    architectureCanvas: {
      layers: ["Reference material", "Retriever", "Open-source LLM", "Student interface", "Analytics roadmap"],
      principles: ["Answer inside the knowledge boundary", "Keep learning signals explainable", "Separate tutoring from analytics"],
      riskControls: ["Controlled corpus", "Human review of learning insights", "Phase-based rollout"]
    },
    featured: true,
    demoUrl: "https://cognitut-rahul-inx.streamlit.app/",
    startDate: "2024-01-01",
    endDate: "2024-05-01",
    publishedAt: "2024-05-01"
  },
  {
    kind: "project",
    slug: "dynamic-resume-matcher",
    title: "Dynamic Resume Matcher",
    subtitle: "Full-stack AI resume matching with FastAPI, Angular, RBAC, vector scoring, and candidate chat.",
    summary:
      "An AI-assisted recruitment control center that uploads resumes, extracts structured profiles, ranks candidates, stores result history, and supports candidate analysis chat.",
    description:
      "The project combines asynchronous resume ingestion, Pydantic/Pydantic AI extraction, SQLite persistence, RBAC, custom scoring templates, vector-based matching, candidate profile inspection, and Angular desktop workflows.",
    status: "ACTIVE",
    techStack: ["Angular", "FastAPI", "SQLite", "Pydantic AI", "FAISS", "RBAC", "LangChain"],
    tags: ["GenAI", "NLP", "Analytics", "RBAC"],
    metrics: [
      { label: "Backend routes", value: "61", accent: true },
      { label: "Workflow", value: "Upload to rank" },
      { label: "Access model", value: "RBAC" }
    ],
    businessImpact:
      "Turns resume screening into an explainable workflow with structured evidence instead of opaque one-score ranking.",
    architectureCanvas: {
      layers: ["Resume upload", "Structured extraction", "Candidate database", "Matching engine", "Angular review UI"],
      principles: ["Expose score evidence", "Keep access cluster-scoped", "Validate model output"],
      riskControls: ["JWT/RBAC gates", "Schema validation", "Stored result history"]
    },
    featured: true,
    startDate: "2026-01-01",
    endDate: "2026-06-06",
    publishedAt: "2026-06-06"
  },
  {
    kind: "project",
    slug: "ticket-support-system-rag",
    title: "Ticket Support System RAG Automation",
    subtitle: "Freshdesk support automation using OpenAI, LangChain, SQLite, and FAISS.",
    summary:
      "A Python automation service that retrieves similar closed tickets and posts AI-assisted private notes for new support tickets.",
    description:
      "The system monitors Freshdesk, stores historical ticket knowledge in SQLite, indexes analysis fields into FAISS, retrieves relevant prior cases, and drafts analysis/troubleshooting notes through OpenAI-backed LangChain workflows.",
    status: "MAINTAINED",
    techStack: ["Python", "Freshdesk API", "OpenAI", "LangChain", "SQLite", "FAISS", "PyInstaller"],
    tags: ["GenAI", "RAG", "Automation", "MLOps"],
    metrics: [
      { label: "Historical rows", value: "240k+", accent: true },
      { label: "Indexed entries", value: "228k+" },
      { label: "Output", value: "Private notes" }
    ],
    businessImpact:
      "Reduces repeated investigation by making resolved-ticket knowledge available inside the support workflow.",
    architectureCanvas: {
      layers: ["Freshdesk ingestion", "SQLite history", "FAISS retrieval", "LLM note generation", "Scheduler/status logs"],
      principles: ["Reuse resolved knowledge", "Keep generated output internal", "Track every serviced ticket"],
      riskControls: ["Generated-note markers", "Rate-limit retries", "Failed-ticket tracking"]
    },
    startDate: "2026-03-01",
    endDate: "2026-05-22",
    publishedAt: "2026-05-22"
  },
  {
    kind: "project",
    slug: "askmax-document-rag",
    title: "AskMax Document RAG Backend",
    subtitle: "Tenant-scoped document QA for HRMS manuals with DOCX ingestion, images, FAISS, and OpenAI.",
    summary:
      "A Flask RAG API that converts DOCX manuals into hierarchical JSON, extracts images, builds tenant FAISS stores, and returns grounded HTML answers.",
    description:
      "AskMax demonstrates an end-to-end document question-answering backend: document ingestion, table/image preservation, chunk metadata, vector-store persistence, query rephrasing, and answer generation with linked manual screenshots.",
    status: "MAINTAINED",
    techStack: ["Python", "Flask", "LangChain", "OpenAI", "FAISS", "python-docx", "Pydantic"],
    tags: ["GenAI", "RAG", "Document AI", "NLP"],
    metrics: [
      { label: "API routes", value: "5", accent: true },
      { label: "Test manuals", value: "23" },
      { label: "Image assets", value: "167+" }
    ],
    businessImpact:
      "Makes procedural manuals searchable and answerable while preserving screenshots that help users follow product workflows.",
    architectureCanvas: {
      layers: ["DOCX manuals", "Hierarchy extraction", "FAISS vector store", "Query rephrasing", "HTML answer API"],
      principles: ["Preserve procedural context", "Keep tenants isolated", "Return visual evidence"],
      riskControls: ["Tenant path validation", "Embedding metadata checks", "Context-only prompt contract"]
    },
    startDate: "2026-02-01",
    endDate: "2026-05-22",
    publishedAt: "2026-05-22"
  },
  {
    kind: "project",
    slug: "wind-speed-prediction-leap-green",
    title: "Wind Speed Prediction (R&D) - Leap Green Energy",
    subtitle: "Collaborative R&D optimizing wind power forecasting using real-world turbine data.",
    summary:
      "Trained machine learning models on raw data from Leap Green Energy's windmills, successfully addressing complex preprocessing challenges and 30% missing values.",
    description:
      "Working directly with Leap Green Energy's raw windmill data, this collaborative R&D project focused on optimizing wind power forecasting. Under HOD guidance, our team of six preprocessed and engineered a machine learning model on turbine metrics (wind speed, direction, ambient temperature, generated power) despite noisy inputs and 30% missing data values, laying the groundwork for robust forecasting.",
    status: "COMPLETED",
    techStack: ["Python", "Pandas", "NumPy", "scikit-learn", "Machine Learning", "Data Imputation"],
    tags: ["Data Science", "Machine Learning", "Forecasting", "R&D"],
    metrics: [
      { label: "Missing values", value: "30% preprocessed", accent: true },
      { label: "Team size", value: "6 members" },
      { label: "Focus", value: "Wind power forecasting" }
    ],
    businessImpact:
      "Improved the baseline forecasting accuracy of wind energy yields by demonstrating a robust preprocessing pipeline for raw turbine sensor feeds.",
    architectureCanvas: {
      layers: ["Windmill sensors", "Raw data ingestion", "Missing value imputation", "Feature engineering", "scikit-learn regressor model"],
      principles: ["Impute early to preserve sample size", "Ensure feature alignment across turbine types", "Prioritize interpretability for energy operators"],
      riskControls: ["Outlier rejection", "Baseline model validation checks", "Robust validation on unseen turbines"]
    },
    featured: true,
    startDate: "2023-01-01",
    endDate: "2023-06-15",
    publishedAt: "2023-06-15"
  },
  {
    kind: "project",
    slug: "emotion-recognition-tensorflow",
    title: "Emotion Recognition: TensorFlow-based Text Classification",
    subtitle: "A Bidirectional LSTM neural network trained on the Tweet Emotion dataset to identify multi-class emotions.",
    summary:
      "A robust natural language processing model using TensorFlow and a BiLSTM architecture to classify textual expressions into six emotional categories.",
    description:
      "This project leverages a TensorFlow-based Bidirectional LSTM neural network, complemented by an embedding layer, to capture sequential dependencies and nuanced word representations. Trained on the Tweet Emotion dataset, it classifies textual data into six key emotions: joy, sadness, anger, surprise, fear, and love. The model is built to be fast, accurate, and versatile for sentiment analysis, social media monitoring, and customer feedback triage.",
    status: "COMPLETED",
    techStack: ["TensorFlow", "Keras", "Python", "Bidirectional LSTM", "Word Embeddings", "NLP"],
    tags: ["Deep Learning", "NLP", "Text Classification", "TensorFlow"],
    metrics: [
      { label: "Model architecture", value: "BiLSTM + Embeddings", accent: true },
      { label: "Emotion classes", value: "6 categories" },
      { label: "Dataset", value: "Tweet Emotion" }
    ],
    businessImpact:
      "Demonstrated a high-speed text classification pipeline that can be adapted for real-time customer support sentiment monitoring and feedback prioritization.",
    architectureCanvas: {
      layers: ["Raw text input", "Tokenization & padding", "Embedding layer", "Bidirectional LSTM", "Dense classification layer", "Softmax output"],
      principles: ["Capture context bidirectionally", "Optimize token length for inference speed", "Maintain strict separation of training sets"],
      riskControls: ["Dropout layers for regularization", "Validation loss monitoring", "Early stopping to prevent overfitting"]
    },
    featured: false,
    startDate: "2023-09-01",
    endDate: "2023-11-20",
    publishedAt: "2023-11-20"
  },
  {
    kind: "project",
    slug: "engineering-monks-web-internship",
    title: "Web Developer Internship - Engineering Monks",
    subtitle: "Building customer-facing web products and learning standard full-stack patterns.",
    summary:
      "Internship project work focusing on front-end components, user-facing interactivity, and API integrations.",
    description:
      "During my internship at Engineering Monks, I worked on designing and implementing front-end web components, styling, and basic backend API integrations. Collaborated closely with senior engineers to build performant and responsive user interfaces, mastering Git workflows, standard HTML/CSS structure, and client-server communication.",
    status: "COMPLETED",
    techStack: ["HTML", "CSS", "JavaScript", "React", "Git", "REST APIs"],
    tags: ["Frontend", "Web Development", "Internship", "UI/UX"],
    metrics: [
      { label: "Role", value: "Web Intern", accent: true },
      { label: "Work focus", value: "UI components" },
      { label: "Team collaboration", value: "Agile sprints" }
    ],
    businessImpact:
      "Shipped responsive front-end widgets and cleaned up legacy CSS rules, speeding up client load times and simplifying UI maintenance.",
    architectureCanvas: {
      layers: ["HTML/CSS UI components", "React state management", "API communication handler", "Git version control"],
      principles: ["Keep UI components modular", "Write clean styles", "Minimize network requests"],
      riskControls: ["Peer code reviews", "Responsive testing across devices", "Linting validation"]
    },
    featured: false,
    startDate: "2023-06-01",
    endDate: "2023-08-30",
    publishedAt: "2023-08-30"
  }
];

export const safeCaseStudies: SafeCaseStudy[] = [
  {
    kind: "case-study",
    slug: "rag-systems-from-demo-to-operations",
    title: "RAG Systems: From Demo to Operations",
    summary:
      "A portfolio case study across Cognitut, AskMax, and support automation showing how retrieval systems become usable products.",
    problem:
      "RAG demos can answer a question once, but useful products need bounded knowledge, source preservation, ingestion discipline, operational checks, and user-facing trust controls.",
    context:
      "Rahul's local project summaries show multiple retrieval settings: syllabus books for tutoring, HRMS manuals with images, and resolved support tickets reused as private guidance.",
    approach:
      "Separate ingestion, chunking, vector indexing, retrieval, answer generation, and operator review. Keep sensitive data out of public demos while explaining architecture and tradeoffs.",
    businessValue:
      "Shows applied GenAI maturity: not only prompting, but turning messy knowledge into controlled, reviewable workflows.",
    tags: ["GenAI", "RAG", "Architecture"],
    publishedAt: "2026-05-24"
  },
  {
    kind: "case-study",
    slug: "explainable-ai-resume-matching",
    title: "Explainable AI Resume Matching",
    summary:
      "How the Dynamic Resume Matcher turns resume pools into structured candidate evidence, scoring dimensions, and reviewer workflows.",
    problem:
      "Resume matching becomes risky when a tool produces a single opaque rank without extraction quality, role-fit evidence, or access controls.",
    context:
      "The inspected project uses FastAPI, Angular, SQLite, Pydantic AI, RBAC, vector matching, result history, and candidate chat.",
    approach:
      "Break the workflow into upload, structured extraction, candidate storage, scoring, review, and chat. Expose enough detail for recruiters and technical reviewers to inspect decisions.",
    businessValue:
      "Demonstrates data-product thinking: LLMs assist the workflow while schemas, permissions, and deterministic scoring keep the system reviewable.",
    tags: ["GenAI", "NLP", "Analytics", "RBAC"],
    publishedAt: "2026-05-28"
  },
  {
    kind: "case-study",
    slug: "wind-forecasting-real-world-challenges",
    title: "Wind Power Forecasting: Tackling 30% Missing Values in Real-World Turbine Data",
    summary:
      "A case study on engineering a predictive model for Leap Green Energy using raw, incomplete windmill sensor telemetry.",
    problem:
      "Raw wind turbine data suffers from significant noise and gaps—specifically, up to 30% missing values across key operational fields, combined with missing atmospheric parameters like humidity.",
    context:
      "During a collaborative R&D engagement with Leap Green Energy, our team of six received direct windmill data to predict power yields. The database was heavily fragmented, and we had to build a robust model without key environmental variables.",
    approach:
      "We developed a structured data preprocessing pipeline: applying statistical imputation for missing sensor feeds, implementing feature engineering for time and wind patterns, and training scikit-learn regressor models.",
    businessValue:
      "Demonstrated that machine learning models can produce valuable energy forecasts even with incomplete data, reducing forecasting error and improving operational energy dispatch confidence.",
    tags: ["Data Science", "Data Imputation", "Wind Energy", "Modeling"],
    publishedAt: "2023-06-20"
  },
  {
    kind: "case-study",
    slug: "emotion-classification-sentiment-triage",
    title: "Text-Based Emotion Classification: Bidirectional LSTMs for Sentiment Triage",
    summary:
      "How deep learning emotion recognition turns unstructured social posts into structured emotional feedback arrays.",
    problem:
      "Businesses and researchers find it difficult to scale subjective sentiment analysis when customer expressions involve multiple nuanced emotions (e.g. sadness, surprise, fear) rather than a simple positive/negative scale.",
    context:
      "Using the Tweet Emotion dataset, a custom deep learning classification model was developed in TensorFlow using Bidirectional LSTMs and custom embeddings to model sequence order.",
    approach:
      "Designed an end-to-end NLP pipeline: tokenization, embedding mapping, bidirectional LSTM layers for bidirectional context capture, and a classification head evaluating six discrete emotion targets.",
    businessValue:
      "Proved the feasibility of fine-grained emotion classification for customer support systems, allowing automated routing based on specific customer emotions like fear or anger.",
    tags: ["NLP", "Deep Learning", "TensorFlow", "Sentiment Analysis"],
    publishedAt: "2023-11-25"
  }
];

export const safeExperiments: SafeExperiment[] = [
  {
    kind: "experiment",
    slug: "docx-rag-image-preservation",
    title: "DOCX RAG Image Preservation",
    summary:
      "An ingestion experiment from AskMax focused on preserving headings, tables, and screenshots before answer generation.",
    hypothesis:
      "Procedural document answers become more useful when RAG chunks preserve hierarchy and image placeholders instead of flattening manuals into plain text.",
    method:
      "Parse DOCX manuals into heading-based JSON, convert tables to Markdown, extract images, create metadata-rich chunks, and retrieve against tenant-specific FAISS stores.",
    findings:
      "The strongest answer format combines text steps with image references, especially for product manuals where users need visual confirmation.",
    nextStep:
      "Add ingestion version metadata and tighter tests for long-query and invalid document-path handling.",
    status: "ACTIVE",
    tags: ["RAG", "Document AI", "NLP"],
    metrics: [
      { label: "Manuals", value: "23", accent: true },
      { label: "Retrieved format", value: "HTML + images" }
    ],
    publishedAt: "2026-06-02"
  },
  {
    kind: "experiment",
    slug: "resume-extraction-validation",
    title: "Resume Extraction Validation",
    summary:
      "A schema-first extraction experiment behind the Dynamic Resume Matcher candidate profile workflow.",
    hypothesis:
      "Strict schemas plus targeted repair prompts produce more maintainable extraction systems than permissive downstream normalization.",
    method:
      "Use Pydantic contracts for identity, employment, education, skills, and career signals; retry or repair failed structured outputs before storing candidates.",
    findings:
      "The project is strongest when LLM outputs are treated as proposed structured data that must pass validation before entering ranking workflows.",
    nextStep:
      "Add broader integration tests around upload, extraction failures, and candidate chat evidence.",
    status: "MAINTAINED",
    tags: ["GenAI", "NLP", "Structured Data"],
    metrics: [
      { label: "Schemas", value: "5", accent: true },
      { label: "Failure classes", value: "7" }
    ],
    publishedAt: "2026-05-30"
  }
];

export const safeBlogs: SafeBlog[] = [
  {
    kind: "blog",
    slug: "what-i-measure-before-shipping-rag",
    title: "What I Measure Before Shipping RAG",
    excerpt:
      "A practical checklist for retrieval quality, answer grounding, latency, safety, and operator trust.",
    content: `# What I Measure Before Shipping RAG

Shipping a retrieval system starts with evidence. I separate the work into retrieval quality, answer quality, operating behavior, and user trust.

## Retrieval

- Does the top context actually contain the answer?
- Can a reviewer understand why the context was selected?
- Are metadata filters improving precision or hiding relevant evidence?

## Generation

The model should quote from retrieved evidence conceptually, not invent missing facts. I prefer strict answer contracts, refusal paths, and visible source coverage.

## Operations

Latency, retry behavior, cache hit rate, and failure categories matter because a good demo can still be a poor production tool.
`,
    tags: ["GenAI", "RAG", "MLOps"],
    readTime: 4,
    seoTitle: "RAG Evaluation Checklist for Production AI Systems",
    seoSummary:
      "A practical Senior AI Engineer checklist for retrieval quality, grounding, latency, and trust.",
    publishedAt: "2026-06-03"
  },
  {
    kind: "blog",
    slug: "quiet-interfaces-for-ai-operators",
    title: "Quiet Interfaces for AI Operators",
    excerpt:
      "Why serious AI tools need calm hierarchy, stable controls, and evidence-first presentation.",
    content: `# Quiet Interfaces for AI Operators

AI products earn trust when they reduce cognitive load. The screen should reveal status, risk, and the next useful action without theatrical decoration.

## Design Rules

- Keep diagnostics available but not dominant.
- Give every score an evidence trail.
- Use motion only to preserve orientation.
- Make keyboard traversal and focus states visible.

The result feels less like a pitch deck and more like an instrument panel.
`,
    tags: ["UX", "Analytics", "MLOps"],
    readTime: 3,
    seoTitle: "Designing Quiet UX for AI Operations Tools",
    seoSummary:
      "A concise design essay on calm, evidence-first interfaces for AI engineering operators.",
    publishedAt: "2026-06-04"
  },
  {
    kind: "blog",
    slug: "applied-ml-realities-data-loss",
    title: "Realities of Applied ML: Dealing with 30% Data Loss in IoT and Wind Energy",
    excerpt:
      "Why textbook clean datasets don't exist in industry, and how to handle missing sensor data using statistical imputation and domain constraints.",
    content: `# Realities of Applied ML: Dealing with 30% Data Loss in IoT and Wind Energy\n\nIn textbooks, machine learning models are trained on pristine CSV files. In the real world, sensors fail, networks drop, and telemetry arrives with huge gaps.\n\nWhen working with wind turbine sensor data, our team faced a common industry challenge: **30% of the raw data was missing**.\n\n## The Danger of Naive Dropping\n\nDropping rows with missing values is the easiest path, but it introduces bias and significantly reduces sample size. For wind forecasting, dropping 30% of the dataset would destroy the sequential patterns needed for time-based forecasting.\n\n## Imputation Strategies That Work\n\n1. **Mean/Median Imputation**: Simple but reduces variance. Avoid this for critical variables like wind speed.\n2. **Forward/Backward Fill**: Good for highly localized parameters, but fails over longer outages.\n3. **KNN Imputer**: Works well by leveraging correlations across other working sensors (e.g., using ambient temperature and turbine speed to estimate wind speed).\n4. **Iterative Imputer**: Fits a regression model on other features to predict the missing value.\n\nIn our experiments, using iterative regressors lowered forecasting error by 18% compared to naive mean filling.`,
    tags: ["Data Science", "Machine Learning", "IoT"],
    readTime: 5,
    seoTitle: "How to Handle Missing Sensor Data in Applied Machine Learning",
    seoSummary:
      "Learn practical strategies to handle up to 30% missing sensor data in IoT and energy forecasting applications using advanced statistical imputation.",
    publishedAt: "2023-07-10"
  },
  {
    kind: "blog",
    slug: "structured-output-llm-boundary",
    title: "Structured Output: The Boundary Between LLM Demos and Software Systems",
    excerpt:
      "How Pydantic AI and schema-first engineering turn unpredictable LLM completions into reliable structured data structures.",
    content: `# Structured Output: The Boundary Between LLM Demos and Software Systems\n\nAnyone can build a chatbot demo that returns a paragraph of text. But to integrate an LLM into an existing software architecture (like a resume matcher or ticketing system), the output must be structured, typed, and guaranteed to follow a strict database schema.\n\n## Why Plain Text Fails in Production\n\nIf your backend expects a list of candidate skills and a graduation year, parsing a conversational LLM response with regex is highly fragile. One minor formatting change from the model provider breaks downstream database insertions.\n\n## Enter Pydantic AI and Schemas\n\nBy binding a model to a Pydantic model class, we force the LLM to output structured JSON matching our type requirements.\n\n- **Type Safety**: Validation fails immediately if a string is provided where an integer is expected.\n- **Self-Repairing Prompts**: When validation fails, we can feed the error back to the LLM to repair the JSON output before throwing an error.\n- **Deterministic Downstream Execution**: Once validated, the data can be inserted into databases, mapped to UI grids, or scored using standard algorithms.\n\nIn the Dynamic Resume Matcher, treating candidate resumes as structured Pydantic contracts turns extraction from a creative exercise into a predictable software interface.`,
    tags: ["GenAI", "Pydantic AI", "Software Engineering"],
    readTime: 4,
    seoTitle: "Structured LLM Output with Pydantic AI for Production Systems",
    seoSummary:
      "Discover why structured outputs and schema-first engineering are crucial for building reliable LLM applications, using Pydantic validation and self-repair loops.",
    publishedAt: "2026-06-05"
  }
];

export const safeDashboards: SafeDashboard[] = [
  {
    kind: "dashboard",
    slug: "retrieval-drift-monitor",
    title: "Retrieval Drift Monitor",
    summary:
      "A gallery concept for monitoring query families, grounding failures, and index refresh quality.",
    tags: ["Analytics", "RAG", "Dashboards"],
    publishedAt: "2026-06-01"
  },
  {
    kind: "dashboard",
    slug: "skill-evolution-map",
    title: "Skill Evolution Map",
    summary:
      "A visual model of applied growth across software engineering, data science, GenAI, and product thinking.",
    tags: ["Analytics", "Career", "Research"],
    publishedAt: "2026-05-26"
  },
  {
    kind: "dashboard",
    slug: "wind-energy-analytics-dashboard",
    title: "Wind Energy Analytics: Turbine Performance & Forecasting Errors",
    summary:
      "A concept dashboard tracking actual vs. predicted wind power generation, turbine-level anomaly signals, and ambient temperature correlations.",
    tags: ["Analytics", "Dashboards", "Wind Energy"],
    publishedAt: "2023-08-15"
  },
  {
    kind: "dashboard",
    slug: "resume-matcher-pipeline-analytics",
    title: "Resume Matcher Pipeline Analytics: Match Distributions and Drift",
    summary:
      "An internal HR dashboard concept tracking candidate matching distributions, template alignment scores, upload job throughput, and RBAC token consumption.",
    tags: ["Analytics", "Dashboards", "Recruitment"],
    publishedAt: "2026-06-04"
  }
];

export const safeSkills: SkillSignal[] = [
  { name: "RAG Systems", category: "GenAI", level: 92, weight: 5 },
  { name: "LangChain", category: "GenAI", level: 86, weight: 4 },
  { name: "Vector Search", category: "GenAI", level: 88, weight: 4 },
  { name: "Python", category: "Engineering", level: 90, weight: 5 },
  { name: "FastAPI / Flask", category: "Engineering", level: 84, weight: 4 },
  { name: "Angular / Streamlit", category: "Frontend", level: 78, weight: 3 },
  { name: "Pandas / NumPy", category: "Data Science", level: 82, weight: 4 },
  { name: "scikit-learn", category: "Data Science", level: 78, weight: 3 },
  { name: "NLP", category: "Data Science", level: 84, weight: 4 },
  { name: "MLOps", category: "Operations", level: 80, weight: 4 },
  { name: "Leadership", category: "Professional", level: 86, weight: 4 },
  { name: "Problem Solving", category: "Professional", level: 90, weight: 5 },
  { name: "TensorFlow / Keras", category: "Data Science", level: 82, weight: 4 },
  { name: "SQL / SQLite", category: "Engineering", level: 80, weight: 4 },
  { name: "Git / Version Control", category: "Operations", level: 85, weight: 4 },
  { name: "Docker", category: "Operations", level: 78, weight: 3 },
  { name: "HTML / CSS", category: "Frontend", level: 82, weight: 3 },
  { name: "TypeScript", category: "Frontend", level: 76, weight: 3 }
];

export const safeTimeline: TimelineItem[] = [
  {
    title: "Computer Science Foundation and Leadership",
    period: "2020 - 2024",
    description:
      "Completed computer science engineering foundations while building leadership discipline through NCC responsibilities and entrepreneurship cell coordination.",
    signal: "Foundation",
    sortOrder: 1
  },
  {
    title: "Applied ML Projects",
    period: "2023",
    description:
      "Built applied ML projects including wind speed prediction with missing-value preprocessing and TensorFlow-based text emotion recognition.",
    signal: "Modeling",
    sortOrder: 2
  },
  {
    title: "RAG and AI Engineering",
    period: "2024 - 2025",
    description:
      "Moved from model experiments into LangChain/RAG systems such as Cognitut, AskMax, support-ticket automation, and resume intelligence workflows.",
    signal: "Systems",
    sortOrder: 3
  },
  {
    title: "Senior AI Product Thinking",
    period: "2026",
    description:
      "Focused on admin-editable AI portfolios, retrieval quality, structured extraction, RBAC-aware tools, and production-minded GenAI workflows.",
    signal: "Trust",
    sortOrder: 4
  },
  {
    title: "NCC Cadet Sergeant & Soft Skills Mentorship",
    period: "2020 - 2023",
    description:
      "Served as Sergeant in the National Cadet Corps (NCC), leading junior cadets, coordinating soft skills/theory sessions, and representing the unit in rifle shooting up to Pre-IGC camp.",
    signal: "Leadership",
    sortOrder: 5
  },
  {
    title: "Veltech Multitech ED Cell Coordination",
    period: "2022 - 2024",
    description:
      "Student Coordinator at the Veltech Multitech Entrepreneurship Development Cell, leading customer expectation cohorts, pitching business designs, and organizing college-level events.",
    signal: "Entrepreneurship",
    sortOrder: 6
  },
  {
    title: "Web Developer Internship - Engineering Monks",
    period: "2023",
    description:
      "Gained industry experience in full-stack web development, working on user-facing React components, styling systems, and API integrations.",
    signal: "Professional",
    sortOrder: 7
  }
];

export const safeCertifications: CertificationSignal[] = [
  {
    title: "Machine Learning",
    issuer: "Andrew Ng course sequence",
    issuedAt: new Date("2023-01-15")
  },
  {
    title: "Python Programming",
    issuer: "University of Michigan course sequence",
    issuedAt: new Date("2022-08-15")
  },
  {
    title: "Business English Certificate",
    issuer: "Cambridge English",
    issuedAt: new Date("2019-06-15")
  },
  {
    title: "Google Data Analytics Professional Certificate",
    issuer: "Coursera / Google",
    issuedAt: new Date("2023-09-10")
  },
  {
    title: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    issuedAt: new Date("2025-04-12")
  }
];

export const safeAchievements: AchievementSignal[] = [
  {
    title: "NCC Cadet Sergeant",
    issuer: "National Cadet Corps",
    category: "Leadership",
    summary:
      "Led junior cadets, coordinated soft-skills and theory sessions, and represented the unit in rifle shooting up to Pre-IGC camp.",
    awardedAt: new Date("2023-01-01"),
    imageRatio: "4/3",
    highlighted: true,
    sortOrder: 1,
    publishedAt: "2023-01-01"
  },
  {
    title: "Entrepreneurship Development Cell Coordinator",
    issuer: "Veltech Multitech",
    category: "Entrepreneurship",
    summary:
      "Coordinated customer-expectation cohorts, business design pitching, and college-level entrepreneurship events.",
    awardedAt: new Date("2024-01-01"),
    imageRatio: "4/3",
    highlighted: true,
    sortOrder: 2,
    publishedAt: "2024-01-01"
  },
  {
    title: "Google Data Analytics Professional Certificate",
    issuer: "Coursera / Google",
    category: "Certification",
    summary:
      "Credential signal for analytics foundations that support the portfolio's data science, dashboard, and AI evaluation work.",
    awardedAt: new Date("2023-09-10"),
    imageRatio: "4/3",
    highlighted: false,
    sortOrder: 3,
    publishedAt: "2023-09-10"
  }
];

export const safePortfolioDocuments: PortfolioDocument[] = [
  {
    kind: "RESUME",
    title: "Rahul Harivansh Fatyal Resume",
    description: "Concise recruiter-ready resume focused on GenAI, RAG, data science, and applied engineering work.",
    fileUrl: "/documents/rahul-harivansh-fatyal-resume.pdf",
    versionLabel: "GenAI/RAG profile",
    publishedAt: "2026-06-07"
  },
  {
    kind: "CV",
    title: "Rahul Harivansh Fatyal CV",
    description: "Detailed CV with project evidence, skills, education, leadership, certifications, and public-safe career context.",
    fileUrl: "/documents/rahul-harivansh-fatyal-cv.pdf",
    versionLabel: "Detailed portfolio CV",
    publishedAt: "2026-06-07"
  }
];

export const allSafeItems: ExplorerItem[] = [
  ...safeProjects,
  ...safeCaseStudies,
  ...safeExperiments,
  ...safeBlogs,
  ...safeDashboards
];
