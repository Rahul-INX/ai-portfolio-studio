# Portfolio Product Audit

Status: Local implementation and verification are complete for items marked **Fixed**. Release work is explicitly excluded by the owner: do not push, deploy, run live smoke tests, or make further production-database changes.

## Evidence-backed findings

| Finding | Status | Severity | Evidence | Minimal decision |
| --- | --- | --- | --- | --- |
| Project cards required a tiny icon click | Fixed | High | `components/card.tsx`; pointer and keyboard Playwright coverage in `tests/portfolio-responsive.spec.ts` | The complete card now navigates without breaking inline controls. |
| Resume-download questions lost document evidence on unknown routes | Fixed | High | `lib/site-context.ts`; assistant route coverage | Download intent is classified before route fallback. |
| CV rendered stored Markdown as text and overflowed mobile | Fixed | High | `app/cv/page.tsx`; responsive suite | CV uses the existing sanitized Markdown renderer. |
| Explorer, Timeline, and CV lacked an H1; blogs duplicated one | Fixed | Medium | page components and `components/section-heading.tsx` | Correct page-level headings; duplicate Markdown H1 stripped. |
| Public content could be overwritten through a duplicate CMS slug | Fixed | Critical | `app/api/content/route.ts`; authenticated CRUD test | Create conflicts return 409; an existing record is never silently replaced. |
| Draft content could not be safely staged | Fixed | High | Prisma visibility fields, content API, CMS form, draft Playwright test | Draft/published/archived state is explicit; draft records remain private. |
| CMS/API authorization trusted authentication without an admin role check | Fixed | Critical | `lib/auth.ts`; `tests/admin-security.spec.ts` | Admin role is required for admin routes and every write/delete endpoint tested. |
| Server errors exposed internal exception detail | Fixed | High | content and provider routes; CMS error test | Client responses are sanitized and carry only a request reference where needed. |
| Owner could not securely manage multi-provider keys | Fixed | High | `lib/ai-key-crypto.ts`, `lib/ai-providers.ts`, provider API/UI, Prisma migrations | AES-256-GCM encrypted server-side keys; mask, test, enable, priority, revoke, model discovery, and fallback are available. |
| AI calls had no shared provider fallback or cost ceiling | Fixed | High | `lib/ai-providers.ts`, `AiUsageBucket`, provider tests | Assistant and Job Fit share ordered fallback, bounded output/timeout, and atomic daily provider caps. |
| Gemini model setup was stale | Fixed | Medium | `.env.example`, provider defaults, model discovery test | Gemini 3.5 Flash-Lite is the initial low-cost model. |
| Admin image storage had no verified cleanup path | Fixed | High | `app/api/files/[id]/route.ts`; upload → preview → delete admin test | An unused blob can be deleted only after all supported content references are absent. |
| Local production-mode admin page failed without a NextAuth secret | Fixed locally | High | Local visual audit showed the Next error screen; ignored `.env.local` secret and `.env.example` requirement added | `NEXTAUTH_SECRET` is now required locally. Deployment configuration remains intentionally unverified. |
| Homepage copy exposes CMS implementation language to recruiters | Fixed | High | Final public screenshots and `app/page.tsx` | Public presentation substitutes recruiter-facing copy only when stored text contains CMS/edit-mode language; owner-editable data remains intact. |
| Skill percentages imply unsupported measurement precision | Fixed | High | `components/knowledge-graph.tsx`, Timeline, and regression test | Skills are now grouped as listed capabilities; no percentage score or precision claim is displayed. |
| Floating controls overlap the mobile hero | Fixed | Medium | `components/edit-mode-provider.tsx`; 390 px final screenshot | The owner edit control shifts above the assistant on small screens and remains centered on larger screens. |
| LinkedIn-hosted proof image is broken | Fixed locally | High | `lib/media.ts`, media unit test, final screenshots | LinkedIn/CDN portrait URLs safely fall back to initials until the owner uploads a replacement; stored data was not changed. |
| Transitive dependency vulnerabilities remain | Deferred | High | Current `npm audit`: 15 findings (2 low, 4 moderate, 9 high); forced remediation would break current Prisma compatibility | Upgrade only with a separately verified compatibility plan. |

## AI key management UX decision

The original screen is confusing to a non-technical owner because it presents four provider cards with the same visual weight, exposes database-style numeric priorities, asks the owner to understand token caps and daily quotas, separates provider enablement from key enablement, and hides the consequence of each setting. “Discover models” also sounds like a catalogue action rather than “check what this key can use.” Multiple keys are shown as raw editable records, so the user has to infer which key is active, whether it works, and whether removing one breaks the system.

The revised interaction uses one mental model: **primary provider → backup provider → encrypted keys**.

1. Show a summary of the current primary route, number of backups, and working keys.
2. Label each provider as Primary, Backup, or Off; let the owner make any provider primary with one action.
3. Make “Add key,” “Test key,” “Save changes,” and “Remove” visible at the point of use.
4. Collapse model discovery, model selection, token limits, and daily limits under “Model and usage controls.” Use plain-language descriptions and retain safe existing defaults.
5. Show only a masked key hint and health state; never show or edit plaintext after saving.
6. Explain the fallback behavior in the page itself, and keep provider/key enablement explicit.

This is intentionally a guided control surface, not a generic infrastructure dashboard. The underlying API remains compatible with encrypted storage, multiple keys, dynamic model discovery, provider order, quotas, testing, and fallback.

## Completed local verification

- `npm run typecheck` passed.
- `npm run lint` passed.
- `git diff --check` passed.
- Production-mode local build passed after loading ignored local environment variables.
- AI provider, Job Fit, and media unit suite passed: 23 tests.
- Authenticated CMS/provider/upload Playwright suite passed: 8 tests.
- Public responsive/accessibility Playwright matrix passed after final public edits: 87 tests.
- Desktop authenticated admin visual audit passed after the local `NEXTAUTH_SECRET` correction: no horizontal overflow at 1440 px.
- Final public visual audit passed at 390 px light, 768 px dark, 1440 px light/dark, and 390 px reduced motion: no horizontal overflow, broken images, or CMS-facing recruiter copy.
- Local Lighthouse passed on `/`, `/explorer`, `/timeline`, and the verified blog route: performance 1.00, SEO 1.00, best practices 1.00, accessibility 0.99–1.00.
- Tracked-file and Git-history secret-pattern scans found no GitHub, Neon, or Gemini key pattern.
- A pre-schema custom PostgreSQL backup exists at ignored `Data/backups/neon-production-before-audit-2026-09-07.dump`; `pg_restore --list` validated its manifest.

## Local-only remaining work

1. The authenticated database-mutating test matrix is already evidenced above; do not rerun it under the owner’s no-further-database-mutation restriction.
2. Re-run all local checks only after a future local code change.
3. Record any future unresolved issue as deferred or blocked with evidence.

## Explicit exclusions

- No Git push or commit is requested.
- No deployment, production smoke test, or live-site review is requested.
- No additional production-database mutation or cleanup is requested.
- Any previously created temporary provider-test records are intentionally left untouched under this restriction.

## Progress log

- 2026-09-07: Backed up production data before additive schema migration; validated the archive manifest.
- 2026-09-07: Repaired public recruiter navigation, heading hierarchy, CV rendering, document-answer routing, and cross-platform browser harness.
- 2026-09-07: Added and verified role-based CMS protection, visibility states, duplicate-slug protection, and sanitized failures.
- 2026-09-07: Added encrypted provider storage, four-provider configuration, dynamic model discovery, ordered fallback, and daily caps; applied additive local development migrations before the owner imposed the local-only freeze.
- 2026-09-07: Verified real authenticated media upload, public preview, and safe unused-file deletion; no temporary media record remained from that test.
- 2026-09-07: Local desktop visual audit caught and corrected the missing `NEXTAUTH_SECRET` configuration. No live deployment was inspected.
- 2026-09-07: Replaced public CMS wording, percentage claims, mobile control overlap, and broken LinkedIn portrait rendering without changing persisted content. Final public local browser suite: 87 passed. Local Lighthouse: all thresholds passed. Secret scan: no configured key pattern found.
- 2026-09-07: Ponytail audit removed the unused `MotionPanel` wrapper and `framer-motion` dependency; no visible behavior depended on it.
