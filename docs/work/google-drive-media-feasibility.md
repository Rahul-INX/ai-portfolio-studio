# Google Drive media storage feasibility

## Question, scope, and boundary

Can the owner connect a Google Drive account so the CMS creates and manages one structured media library, stores uploaded images/documents there instead of Neon `StoredFile.data`, and permits substantially larger uploads?

Implementation and production cutover are complete. The owner connected Google Drive through OAuth, the private managed library is verified, all portfolio media references now use Drive-backed routes, and Neon no longer stores media bytes.

## Evidence

| Claim | Classification | Evidence |
| --- | --- | --- |
| Current uploads store whole file bytes in Neon PostgreSQL. | Confirmed | `app/api/media/route.ts:20-83`, `app/api/document-upload/route.ts:20-83`, `prisma/schema.prisma:384-393` create `StoredFile.data: Bytes`. |
| The current practical upload cap is 4 MB for both images and documents. | Confirmed | `lib/stored-files.ts:1-42` defines `MAX_DATABASE_FILE_SIZE`; both upload routes reject larger requests. |
| CMS records already store a URL string, rather than a database-file foreign key. | Confirmed | `components/content-studio-form.tsx:990-1037`, `app/api/content/route.ts:238-446`; records use `imageUrl`, `fileUrl`, or `profileImageUrl`. |
| Existing public rendering accepts app-relative media routes and safe HTTPS URLs. | Confirmed | `lib/media.ts:7-14`; existing URLs can migrate gradually without rewriting all content records. |
| Existing file deletion protects content references before deleting the database blob. | Confirmed | `app/api/files/[id]/route.ts:51-81`; provider-backed deletion needs the same reference guard. |
| Google Drive can create folders, upload files, manage permissions, and use resumable sessions. | Confirmed | [Google folder guide](https://developers.google.com/workspace/drive/api/guides/folder), [upload guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads). |
| A personal Gmail account cannot use a Shared Drive as its owner-managed library. | Confirmed | [Google Shared Drives overview](https://developers.google.com/workspace/drive/api/guides/about-shareddrives): personal accounts cannot create Shared Drives. |
| A service account is a suitable replacement for user OAuth on a personal Drive. | Disproved | Google documents that service accounts cannot own files; use user OAuth for My Drive, or a Workspace Shared Drive for an organization. |
| Existing server-proxied upload routes alone remove the 4 MB constraint. | Disproved | They still receive the complete request before sending it onward. Google resumable uploads should instead stream from the owner browser after a server-authorized session is created. |

## Decision

**Feasible and worthwhile for this owner-operated portfolio**, with Google Drive acting as a private origin and the portfolio app keeping a small metadata index. It is not a direct public-Drive-link integration.

Use OAuth 2.0 with the narrow `https://www.googleapis.com/auth/drive.file` scope. It lets the app create and manage the files/folders it owns without requesting broad access to unrelated Drive files. The app stores the long-lived refresh token encrypted server-side; it never returns it to the browser. Google recommends securely storing refresh tokens for ongoing private Drive access. See [Google OAuth scope guidance](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

Do **not** make every Drive file public or store `webViewLink`/download links in public content. Drive permissions, link access, and resource keys complicate public delivery. Keep files private in Drive and serve them through a stable app route such as `/api/media/:assetId`; this preserves current portfolio URLs, response headers, caching, content-type validation, and future storage portability. See [Google sharing guidance](https://developers.google.com/workspace/drive/api/guides/manage-sharing).

## Proposed Drive layout

```text
Portfolio Studio Media/
  images/
    profile/
    projects/
    case-studies/
    experiments/
    blogs/
    dashboards/
    achievements/
  documents/
    resume/
    cv/
    supporting/
```

Use per-content-kind folders, not one folder per slug. CMS media is uploaded before a new record is saved and a record slug can change; slug-level folders create orphan/move complexity without helping the owner find media. File names should retain a sanitized original name and receive an app-managed unique prefix.

The app creates the root and fixed children idempotently on first successful connection, marks them with app metadata, and saves their Drive IDs. It must never recursively reorganize unrelated Drive content.

## Smallest viable implementation plan

1. **Owner connection and storage setup**
   - Add an admin-only “Connect Google Drive” page with OAuth authorization-code flow and explicit scope explanation.
   - Add encrypted `DriveConnection` metadata: owner account identifier, encrypted refresh token, root folder ID, folder IDs, connection status, and last verification time.
   - Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and exact callback URL only as deployment/local environment configuration. Never put a refresh token in `.env` or return it to the client.
   - On successful callback, create or recover the fixed Drive folder layout and verify write access.

2. **Provider-neutral media metadata**
   - Add `MediaAsset` rather than overloading `StoredFile`: internal ID, provider (`GOOGLE_DRIVE`), external Drive file ID, filename, MIME type, byte size, logical folder, and lifecycle timestamps.
   - Retain `StoredFile` and `/api/files/:id` unchanged for existing content. New Drive assets receive `/api/media/:assetId`; no bulk rewrite is necessary.
   - Update reference/deletion checks and unused-media cleanup to understand both providers; delete Drive files to trash only after no portfolio record references them.

3. **Large, resumable owner upload**
   - CMS asks the server to validate type, intended folder, owner session, and size; server starts a Drive `uploadType=resumable` session in the correct folder.
   - Browser uploads the selected file directly to the short-lived resumable session URL with progress and retry/resume support. Google documents session URLs and resumable recovery; sessions expire after one week. [Google upload guide](https://developers.google.com/workspace/drive/api/guides/manage-uploads).
   - Browser submits completion metadata to the server. Server verifies the Drive file is in the managed folder and creates the `MediaAsset`, then returns the stable app media URL to the existing CMS field.
   - Keep a conservative product policy for portfolio images/documents (for example 100 MB initially) even though Drive permits far larger files. Video hosting and high-traffic delivery are not in this scope.

4. **Private Drive origin, public portfolio delivery**
   - Implement authenticated server-to-Drive `GET /api/media/:assetId`, fetch bytes with the refresh token, and preserve current `Content-Type`, `Content-Disposition`, `nosniff`, and cache behavior.
   - Allow public reads only for assets referenced by published public content; do not expose a generic “fetch any Drive file ID” endpoint.
   - Add a small admin media-library view: folder/category, filename, size, used-by count, test preview, and safe remove. This is the appropriate place to browse and manage Drive-backed assets.

5. **Migration and rollback**
   - Leave current Neon files untouched initially.
   - Provide owner-selected migration batches: copy one legacy file to Drive, verify its managed parent and byte size, swap the one content URL, then delete only that verified legacy source.
   - Disconnecting Drive disables new Drive uploads but does not break already migrated content if the owner elects to retain the encrypted connection; a full disconnect must warn that it will make Drive-backed public media unavailable.

## Verification required before release

- Unit: Drive path selection, encrypted refresh-token handling, media reference checks, URL routing, MIME/size policy, and idempotent folder creation.
- Mocked Drive integration: OAuth callback, folder recovery, resumable session creation/finalization, retry behavior, file proxy, and trash-on-unreferenced delete.
- Browser: owner connects, uploads an image above the old 4 MB cap, sees progress, saves a project, public image renders, removes reference, then safely trashes media.
- Security: unauthenticated users cannot initiate upload, list folders, obtain session URLs, fetch an arbitrary Drive ID, or disconnect the owner connection.
- Manual: Google consent screen, token refresh after restart, Drive folder contents, responsive CMS upload UI, and public cache/content headers.

## Risks and non-goals

- Google Drive is suitable for a personal portfolio media library but is not a general-purpose high-traffic image/video CDN. If traffic, video, transformations, or global performance become priorities, Cloudinary, Cloudflare R2, or S3-compatible storage is a better long-term origin.
- Public media proxying adds Google Drive API download quota and application bandwidth. Cache headers and image optimization policy need measurement after implementation.
- Google OAuth consent and redirect URLs require owner-controlled Google Cloud configuration. A single personal owner can test in development, but a publicly distributed app has consent-screen and verification obligations.
- Do not use `drive.appDataFolder`: it is hidden from the user and unsuitable for owner-managed portfolio media.
- No service account-only design for personal Gmail Drive; use owner OAuth.

## Progress and estimate

- [x] Repository and current persisted-media paths traced.
- [x] Official Google Drive upload, folder, sharing, OAuth scope, quota, and account-model constraints checked.
- [x] Implementation-ready architecture and verification plan recorded.
- [x] Owner approved Google Drive as the desired personal-media origin.
- [x] Admin-only OAuth callback, encrypted Drive connection, fixed private folder layout, and reconnect-safe library reuse implemented.
- [x] Direct resumable CMS upload, stable private Drive media proxy, public-reference guard, and 100 MB policy implemented.
- [x] Explicit batch migration and cleanup workflow implemented: parent/size verification, URL rewrite, then individual Neon deletion; failed files remain in Neon.
- [x] Local validation: TypeScript, 44 unit tests, production build, and whitespace diff check passed.
- [x] Local Google OAuth connection and complete Drive source copy verified.
- [x] Production cutover and final Neon blob cleanup completed and verified.

The live portfolio now uses eight private Google Drive originals through stable `/api/media/:id` routes. Neon retains portfolio records and Drive metadata but contains zero `StoredFile` rows and zero media bytes.

### Implementation log

- 2026-09-07: Re-ran `npm run typecheck`, `npm test` (44 passing), `npm run build`, and `git diff --check` after aligning public Drive-media reference checks with every migration-supported content field. No database or Drive mutation was performed.
- 2026-09-07: Applied the additive `20260907020000_add_google_drive_media` migration to Neon. Prisma reports the schema is current; no existing media was moved or deleted. Replaced the CMS dead-end state with a direct Google setup action and plain-language account-picker explanation.
- 2026-09-07: Confirmed all three local Google OAuth settings are present, restarted the production-mode local server, visually verified the `Connect Google Drive` action on port 3000, and confirmed the connect endpoint returns a Google Accounts redirect. Eleven legacy Neon media items remain untouched pending owner consent.
- 2026-09-07: Owner OAuth completed. Migrated every referenced Neon blob plus the repository-served resume, CV, and Cognitut fallback image; replaced the final embedded LinkedIn image reference; removed unreferenced duplicate uploads; and reduced Neon media state to eight active Drive metadata rows with zero blob rows or trashed metadata rows.
- 2026-09-07: Completion checks passed: eight of eight active media references resolve through `/api/media`, all return HTTP 200 with non-empty content, no stored/embedded media references remain outside Drive, and homepage/Cognitut/timeline/CV browser checks report zero broken images. Fixed resumable-upload CORS by forwarding the CMS origin when creating the Drive session; a real browser upload, preview, and trash cycle then passed.
- 2026-09-07: Cross-environment audit showed the shared Neon URL rewrite reached the older Vercel build before its Drive route was deployed. Restored temporary Neon copies for all eight active assets to preserve the live site while retaining verified Drive originals. Removed one inaccessible LinkedIn internship-certificate image reference while preserving its text and Protowiz link. Final Drive-only cutover now requires production code and OAuth environment deployment first.
- 2026-09-07: Reproduced the local port 3000 failure visually. A stale development runtime first retained the pre-migration Prisma client, then failed HMR and left client panels unhydrated. Restarted port 3000 with the verified production build and confirmed by browser screenshot that “Open Google setup” is visible with no internal-error or loading state.
- 2026-09-07: Updated repository setup documentation to describe private Drive storage, exact local/production OAuth callback configuration, resumable 100 MB uploads, encrypted token storage, and the deploy-before-migrate safety boundary.
- 2026-09-07: Revalidated the cutover boundary after Google settings were saved: typecheck, all 44 tests, production build, and diff check pass; Neon currently holds eight temporary compatibility files (5,900,030 bytes) matching eight active Drive originals. Local Drive admin routing returns authenticated JSON, while the live deployment still returns its HTML 404 for both Drive admin and media routes, so production migration and Neon deletion remain unsafe until deployment is authorized and completed.
- 2026-09-07: Owner authorized production deployment and final cutover. Added byte-identical Drive-asset reuse so the eight temporary Neon copies relink to their existing originals rather than creating duplicates; all eight real pairs matched. Release validation passes: typecheck, 45 unit tests, production build, staged secret scan, and 115 browser checks with two intentional duplicate-viewport skips. Fixed the discovered light-theme contrast issue and serialized stateful browser execution against shared Neon.
- 2026-09-07: Initial CLI push attempts were rejected, so the authenticated GitHub App published the exact verified local tree without using the replacement PAT. Vercel deployed commit `d6d65e3` successfully and the live Drive routes are active. Authenticated production verification reports `configured=false` and a real Drive asset returns 503 because the production Google OAuth/encryption variables are not yet present. Drive references and all eight Neon compatibility blobs remain unchanged.
- 2026-09-08: Confirmed all four Drive/encryption variables are scoped to Vercel Production and redeployed commit `d6d65e3`. Authenticated production checks report `configured=true` and `connected=true`; token refresh verification passes and a real Drive asset returns its exact expected MIME type and byte count.
- 2026-09-08: Completed the guarded cutover. Neon now has zero `StoredFile` rows and zero stored media bytes; `VACUUM (ANALYZE)` confirms zero live/dead blob rows. Drive retains eight active, referenced originals totaling 5,900,030 bytes with no duplicates or trashed assets. All eight live media routes returned HTTP 200 with exact expected sizes and types. A crawl of all 25 published/static routes found no HTTP failures, console errors, overflow, or broken media after allowing the one lazy-loaded timeline portrait to load; the authenticated CMS visually reports zero legacy Neon media.
