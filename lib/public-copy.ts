export const publicProfileSummary =
  "GenAI and data science portfolio covering RAG, retrieval systems, support automation, resume intelligence, applied machine learning, and evidence-led engineering.";

const ownerOnlyLanguage = /\b(admin|cms|editable|edit mode)\b/i;

export function publicProfileCopy(value: string, fallback: string) {
  return ownerOnlyLanguage.test(value) ? fallback : value;
}
