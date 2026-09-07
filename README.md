# Portfolio Platform

Reusable personal portfolio and evidence hub with JD-derived recruiter matching and an authenticated CMS.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS design tokens with light/dark mode
- Framer Motion for restrained entrance transitions
- Prisma + PostgreSQL for dynamic content models
- NextAuth credentials provider for the admin CMS
- Vercel-ready deployment shape
- Private Google Drive media storage with stable app-served URLs

## Local Setup

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run prisma:generate
npm.cmd run dev
```

For database-backed publishing, set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`, then run:

```powershell
npm.cmd run prisma:push
npm.cmd run prisma:seed
```

Portfolio records stay in PostgreSQL. Images and documents can live in a private,
app-managed Google Drive library and are served through stable `/api/media/[id]`
URLs. Existing PostgreSQL `/api/files/[id]` media remains supported during
migration.

To connect Drive, enable the Google Drive API, create a Web OAuth client, and set:

```dotenv
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/api/admin/google-drive/callback
```

Add the redirect URI exactly to the OAuth client's authorized redirect URIs. For
production, use the deployed origin instead, for example
`https://your-domain.example/api/admin/google-drive/callback`, and set the same
value in the deployment environment. Then open **Admin CMS -> Media storage ->
Connect Google Drive**, select the owner account, and approve access.

Drive uploads use browser-to-Drive resumable sessions and support files up to the
CMS policy limit of 100 MB. The app requests the narrow `drive.file` scope, keeps
Drive files private, and stores the refresh token encrypted with
`AI_KEYS_ENCRYPTION_KEY`. Configure and verify the production OAuth environment
before migrating shared-database media or deleting PostgreSQL copies.

## Content Safety

`Data/` is private source context only. Public examples are generic abstractions of AI engineering patterns and must not copy proprietary architecture, client names, sensitive metrics, private documents, or company IP.

## Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## CMS Coverage

The authenticated admin studio supports:

- Projects
- Case studies
- Experiments
- Blogs
- Dashboards and gallery entries
- Skills
- Certifications
- Timeline events
- Site owner identity, contact details, hero copy, page introductions, and SEO metadata
- Resume/CV documents and project repository/demo links

Public pages read from Prisma when `DATABASE_URL` is configured and fall back to portfolio-safe seed content for local preview.

## Rebrand A Fork

1. Configure a new PostgreSQL database and unique `NEXTAUTH_SECRET`.
2. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`; never deploy the seed defaults.
3. Run `npm.cmd run prisma:push` and `npm.cmd run prisma:seed`.
4. Sign in from the header account icon or `/admin/login`.
5. Update **Site Profile** first. This drives the visible owner name, role, contact details, metadata, manifest, assistant identity, Job-Fit wording, CV heading, and AI-readable feeds.
6. Replace projects, timeline records, skills, certifications, documents, writing, case studies, experiments, and dashboards through the studio.
7. Upload the new portrait and resume/CV documents before publishing.
8. If using Google Drive, connect it before uploading media and complete the
   explicit CMS migration only after the production callback and environment are
   verified.

Authenticated users can enable edit mode from public pages. Hero fields edit in context; projects, skills, and timeline records expose contextual edit links that open the existing studio with the correct record selected.
