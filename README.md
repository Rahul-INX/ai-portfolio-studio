# Portfolio Platform

Production-quality personal portfolio and knowledge hub for a Senior AI Engineer / Data Scientist.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS design tokens with light/dark mode
- Framer Motion for restrained entrance transitions
- Prisma + PostgreSQL for dynamic content models
- NextAuth credentials provider for the admin CMS
- Vercel-ready deployment shape
- Cloudinary-compatible remote image configuration plus local portfolio-safe media

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

Set `CLOUDINARY_CLOUD_NAME` when dashboard/gallery image records should use Cloudinary public IDs. Fully-qualified `https://...` and local `/media/...` URLs are also accepted.

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

Public pages read from Prisma when `DATABASE_URL` is configured and fall back to portfolio-safe seed content for local preview.
