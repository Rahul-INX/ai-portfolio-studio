# Changelog

## 2026-06-10
- Added a reusable inline text editor primitive for page-local editing.
- Converted shared section headings to support inline editing in admin edit mode.
- Wired inline editing into explorer, timeline, and CV section headings using existing site profile fields.
- Added editable homepage profile fields for the latest evidence label and homepage section copy.
- Synced the Prisma schema and database so the new site profile fields persist safely.
- Added inline editing for explorer card titles and summaries directly on the page.
- Added editable resume/CV hub copy, skills title, certifications title, and CV section headings.
- Added editable job-fit hero copy and output-panel labels on the public job-fit page.
- Added editable job-fit section labels so the public fit brief route uses inline editing across its main visible text surfaces.
- Added editable job-fit form, loading, and action labels so the public fit brief route keeps its interaction copy in the same inline-edit system.
- Added an editable homepage contact CTA label so the visible homepage link uses the same inline-edit model.
- Cleaned up a few lint issues in the achievements editor to keep validation green.
- Preserved the existing Prisma-backed CMS and save/publish flow for explicit persistence.
