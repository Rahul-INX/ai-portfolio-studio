export const cvSections = {
  summary: {
    title: "Professional Summary",
    body:
      "GenAI Developer and Data Science professional focused on RAG systems, document intelligence, support automation, resume intelligence, and applied machine learning. Rahul's work combines Python backends, LangChain/OpenAI pipelines, FAISS/vector retrieval, structured extraction, and evidence-first interfaces for practical AI workflows."
  },
  skills: [
    "Python, FastAPI, Flask, Streamlit, Angular, TypeScript",
    "LangChain, OpenAI, Pydantic AI, FAISS, vector retrieval, prompt and context design",
    "Pandas, NumPy, scikit-learn, TensorFlow/Keras, NLP, data preprocessing",
    "SQLite, API integration, async jobs, RBAC-aware workflows, admin tooling",
    "Technical communication, leadership, teaching, public speaking, problem solving"
  ],
  projects: [
    {
      title: "Ticket Support System RAG Automation",
      body:
        "Built a Python automation service that connects Freshdesk, OpenAI/LangChain, SQLite, and FAISS to reuse historical closed-ticket knowledge for AI-assisted internal support notes."
    },
    {
      title: "AskMax Document RAG Backend",
      body:
        "Developed a Flask document-question-answering backend that ingests DOCX manuals, preserves hierarchy, tables, and screenshots, builds tenant-scoped FAISS stores, and returns grounded HTML answers."
    },
    {
      title: "Dynamic Resume Matcher",
      body:
        "Created a full-stack AI resume matching system with FastAPI, Angular, SQLite, RBAC, asynchronous resume ingestion, Pydantic AI extraction, structured candidate profiles, scoring, and candidate chat."
    },
    {
      title: "Cognitut Knowledge-Based Tutoring System",
      body:
        "Built a Streamlit/LangChain tutoring platform where students ask questions against local syllabus and reference-book knowledge using open-source LLMs."
    },
    {
      title: "Wind Speed Prediction R&D",
      body:
        "Worked on machine-learning preprocessing and forecasting for raw wind-turbine data, handling noisy sensor feeds and nearly 30% missing values."
    },
    {
      title: "Emotion Recognition Text Classification",
      body:
        "Developed a TensorFlow Bidirectional LSTM model for multi-class emotion classification over text, covering joy, sadness, anger, surprise, fear, and love."
    }
  ],
  experience: [
    {
      title: "Web Developer Intern - Engineering Monks",
      body:
        "Worked on front-end components, styling, Git workflows, and basic API integration while learning standard client-server delivery patterns."
    },
    {
      title: "Student Coordinator - Veltech Multitech Entrepreneurship Development Cell",
      body:
        "Coordinated student entrepreneurship work, customer-expectation discussions, pitch-style activities, and college-level event responsibilities."
    },
    {
      title: "NCC Cadet Sergeant",
      body:
        "Earned promotions through regularity, responsibility, and dedication; guided junior cadets on soft skills, theory, and camp preparation, and reached Pre-IGC camp in rifle shooting."
    }
  ],
  education: [
    "B.E. Computer Science Engineering, Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College, Chennai, 2020-2024",
    "Higher Secondary, Science PCM, Government Co-ed Senior Secondary School, Lajpat Nagar, 2019",
    "Secondary School, Surajkund International School, 2017"
  ],
  certifications: [
    "Machine Learning - Andrew Ng course sequence",
    "Python Programming - University of Michigan course sequence",
    "Google Data Analytics Professional Certificate",
    "AWS Certified Cloud Practitioner",
    "Business English Certificate - Cambridge English"
  ],
  leadership: [
    "NCC leadership, junior cadet mentorship, camp guidance, awareness runs, cleanliness campaigns, and blood donation event volunteering",
    "Entrepreneurship Development Cell coordination with a strong interest in customer expectations and business design",
    "Technical curiosity around software modification, operating systems, AI/ML reading, and improving broken or inefficient workflows"
  ]
};

export function cvPlainText() {
  return [
    cvSections.summary.title,
    cvSections.summary.body,
    "Skills",
    ...cvSections.skills,
    "Projects",
    ...cvSections.projects.map((item) => `${item.title}: ${item.body}`),
    "Experience",
    ...cvSections.experience.map((item) => `${item.title}: ${item.body}`),
    "Education",
    ...cvSections.education,
    "Certifications",
    ...cvSections.certifications,
    "Leadership",
    ...cvSections.leadership
  ].join("\n");
}
