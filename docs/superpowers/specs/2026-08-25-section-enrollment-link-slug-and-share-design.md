# Section enrollment links: readable URLs, share metadata, and section photo

**Date:** 2026-08-25
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-08-section-enrollment-link-design.md`](2026-08-08-section-enrollment-link-design.md) — token table, `/i/[token]` form, generate/copy/share panel. This spec does not change what a submission creates (still a lead).
- [`2026-08-24-registration-existing-student-and-multi-section-design.md`](2026-08-24-registration-existing-student-and-multi-section-design.md) — the token form stays the same; only the public URL and share chrome change.

**Governing rules:** `28-tenant-register-surface.mdc` (do not fork `RegisterForm`), `09-i18n-copy.mdc`, `04-security.mdc`, `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `01-design-system.mdc` (image uploads use `InlineUploadProgressBar`), `03-architecture.mdc` (250-line ceiling).

## Intent

A teacher or admin copies a section enrollment link and pastes it in WhatsApp. Today the URL is only a UUID (`/{locale}/i/{uuid}`) and the preview is the generic institute card. The family cannot tell which group they are joining until they open the page.

This spec makes every generated enrollment link readable and shareable: the path includes the section name plus the UUID, WhatsApp shows the section name with cohort and schedule, and a section photo (or a tenant-agnostic fallback) is the preview image. If the admin uploaded a photo, that same photo is the section’s face on the identity surfaces listed below.

## Context

`SectionEnrollmentLinkPanel` and the teacher section list build `/{locale}/i/{token}`. `src/app/[locale]/i/[token]/page.tsx` sets only `robots: { index: false }` and inherits the locale Open Graph image. `loadSectionEnrollmentLink` already returns `sectionName`, `cohortName`, and `scheduleSlots`. The token stays a UUID on `section_enrollment_links`; `anon` still cannot `SELECT` `academic_sections`.

Events and blog already use slugs and `buildPublicShareMetadata`. Student badges already use a public storage bucket plus a per-token OG image. This spec follows those two patterns rather than inventing a third.

## Decisions

| Topic | Choice |
|-------|--------|
| Canonical public path | `/{locale}/i/{slug}/{uuid}` |
| Lookup key | UUID only. The slug is cosmetic and is not stored |
| Old `/{locale}/i/{uuid}` | Permanent redirect to the canonical path |
| Stale slug (section renamed) | Redirect to the current slug |
| Empty slug | Fallback segment `seccion` |
| Share title | `{sectionName} · {instituteName}` |
| Share description | Cohort + one-line schedule. No seats (they change; WhatsApp caches) |
| Share image | Admin photo if present, else the generic fallback |
| Photo required at create | No |
| Who uploads / replaces / removes | Admin only |
| Photo on identity surfaces | Yes, when a photo exists. No generic thumbnail in the UI |
| Photo on finance / mail / KPI tables | No |
| Token, RPC auth, lead insert | Unchanged except the resolve RPC also returns the image path |

## Architecture

### Readable URL

One helper builds and parses paths:

- `slugify` is a shared `slugifyPublicPathSegment` (NFD, strip marks, lowercase, non-alnum → `-`). `slugifyEventTitle` becomes a one-line wrapper so the rules cannot drift.
- `buildSectionEnrollmentLinkPath(locale, sectionName, token)` → `/{locale}/i/{slug}/{token}`.
- `parseSectionEnrollmentLinkPath(parts)` accepts `[uuid]` or `[slug, uuid]` and returns the token (or null).

Callers of the helper: `SectionEnrollmentLinkPanel`, the teacher section list copy control, `navigator.share`, tests, and the public page redirect.

The panel and list need the **current section name** at copy time. Pass it as a prop; do not read it from the token row.

### Routes

| Path | Behaviour |
|------|-----------|
| `/{locale}/i/{slug}/{uuid}` | Canonical page. Resolve by UUID. If the slug does not match the current name, `redirect` to the canonical path |
| `/{locale}/i/{uuid}` | Same resolve. If valid, `redirect` to the canonical path. If not, the existing unavailable screen |

Keep `submitSectionLinkRegistration` on the token; the form still posts the UUID. Do not fork `RegisterForm` or the branded surfaces.

New `src/app/[locale]/i/[slug]/[token]/page.tsx` is the canonical page (`generateMetadata` + form). The existing `src/app/[locale]/i/[token]/page.tsx` only redirects (or shows unavailable). Keep `src/app/[locale]/i/[token]/actions.ts` where it is.

### Share metadata

`generateMetadata` on the canonical page:

- Load the link with `loadSectionEnrollmentLink` (extended with `referenceImagePath`).
- Unknown / closed token: title from the existing unavailable copy, `robots: { index: false }`, noindex.
- Valid: `buildPublicShareMetadata` with title, description, canonical path, and `coverImageUrl` = photo public URL or `absoluteUrl("/images/section-share-fallback.png")`.
- `robots: { index: false, follow: false }` stays. Invite links are not for Google. WhatsApp still scrapes them.

Description is a single line, locale-aware weekdays from `register.sectionLink.weekdays`:

`{cohortName} · Lunes 18:00–19:30, Miércoles 18:00–19:30`

If there are no slots, omit the schedule part. If there is no cohort name, omit that part. Never invent seats.

`navigator.share({ title, text, url })` uses the same title and description, not the generic panel title.

### Section photo

**Column** on `academic_sections`: `reference_image_path TEXT NULL`. Comment: storage object path in bucket `section-images`. Additive only.

**Bucket** `section-images`, public read (WhatsApp and `<img>` need a stable anonymous URL). Writes only through the service-role client in admin server actions. Mirror `085_badge_images_storage.sql`: public SELECT policy, no client-side insert from `authenticated` / `anon`. Object path `{section_id}/{timestamp}.{ext}`.

**MIME / size:** `image/jpeg`, `image/png`, `image/webp`. Max 2 MiB. No SVG.

**RPC:** `resolve_section_enrollment_link` also returns `reference_image_path`. `anon` still has no `SELECT` on `academic_sections`.

**Public URL helper** (same idea as `badgeImagePublicUrl`): deterministic `…/storage/v1/object/public/section-images/{path}`.

**Fallback asset:** `public/images/section-share-fallback.png`. Tenant-agnostic illustration approved in brainstorm (no brand, no type). Source to copy during implementation: `docs/superpowers/specs/assets/2026-08-25-section-share-fallback.png`. Used only as `og:image` when `reference_image_path` is null. UI surfaces do **not** show this fallback.

### Where the photo appears

Show the uploaded photo when `reference_image_path` is set. If it is null, show no image (text only).

| Surface | Treatment |
|---------|-----------|
| New-section modal | File field next to the name (`NewSectionTeacherAndNameFields` / `AcademicNewSectionModal`). Optional. Preview the chosen file. `InlineUploadProgressBar` |
| Admin section header | Thumbnail beside the name (`AcademicSectionPageHeader`) |
| Admin section settings | Replace / remove next to the name (`AcademicSectionSettingsSummary`) |
| Teacher section header | Thumbnail only. No upload |
| Admin cohort section list | Thumbnail beside the name |
| Teacher section list | `TeacherSectionCard` thumbnail beside the name |
| Public token form | `SectionEnrollmentLinkCard` |
| WhatsApp / `og:image` | Photo or generic fallback |
| Finance tables, emails, KPIs, registration inbox columns | Name only |

### Admin write path

`createAcademicSectionAction` stays the create and accepts an optional image payload. After insert it uploads, then sets `reference_image_path`. If the upload fails, the section still exists, the column stays null, and the modal says the photo did not save so they can retry on the section page.

Later: `uploadSectionReferenceImageAction` and `removeSectionReferenceImageAction`, `assertAdmin` only. Replace deletes the previous object. Remove clears the column and deletes the object.

Teachers who generate the link never write the bucket.

Create-section tour: the photo field lives in the existing basics block. The tour does not require a file.

## Data flow

```
Admin creates section (name required, photo optional)
  → INSERT academic_sections
  → optional upload to section-images + SET reference_image_path

Admin or teacher copies the link
  → buildSectionEnrollmentLinkPath(locale, currentName, token)

Family opens /{locale}/i/{slug}/{uuid}
  → parse token, resolve_section_enrollment_link
  → generateMetadata + RegisterSurfaceByTemplate
  → WhatsApp scrapes og:title, og:description, og:image

Family opens old /{locale}/i/{uuid}
  → redirect 308 to /{locale}/i/{currentSlug}/{uuid}
```

## Error handling

| Case | Result |
|------|--------|
| Bad file type, empty, or over 2 MiB | No write. Section create still succeeds. Inline error |
| Upload fails after insert | Section without photo. Inline error. Share uses fallback |
| Malformed token | Existing unavailable copy. No query |
| Unknown, rotated, inactive, or archived | Existing unavailable / closed copy |
| Slug mismatch | Redirect to current slug |
| Remove photo | Column null, object deleted, share uses fallback |
| Non-admin upload | Forbidden. No write |

## Testing

**Unit**

- Path builder / parser: slug, `seccion` fallback, extract UUID from one or two segments.
- Share metadata builder: title, description, photo URL vs fallback. No seats.
- `loadSectionEnrollmentLink` maps `reference_image_path`.
- Create / upload / remove actions: admin ok; teacher rejected; invalid MIME rejected.
- `SectionEnrollmentLinkPanel` copies `/{locale}/i/{slug}/{uuid}`.
- `SectionEnrollmentLinkCard`, `TeacherSectionCard`, admin header: photo when path is set, no image when null.

**E2E**

- Generate link → URL matches `/{locale}/i/{slug}/{uuid}` → anonymous submit still lands in the inbox.
- Old `/{locale}/i/{uuid}` reaches the form (via redirect).
- Optional: admin creates a section with a photo and the public card shows it.

**Migration**

- File-text or DB probe: `anon` cannot `SELECT` `academic_sections.reference_image_path` directly; the resolve RPC returns it; bucket is public-read and not world-writable.
- Apply with `sql:apply-migration:all-tenants`.

## Files (expected)

- `supabase/migrations/189_section_reference_image.sql` — column, RPC replace, bucket + policies
- `public/images/section-share-fallback.png`
- `src/lib/register/sectionEnrollmentLinkPath.ts`
- `src/lib/register/buildSectionEnrollmentLinkShareMetadata.ts`
- `src/lib/register/sectionReferenceImagePublicUrl.ts`
- `src/lib/register/sectionEnrollmentLink.ts` + `loadSectionEnrollmentLink.ts`
- `src/app/[locale]/i/[token]/page.tsx` and/or `src/app/[locale]/i/[slug]/[token]/page.tsx`
- `src/app/[locale]/dashboard/admin/academic/sectionActions.ts` + new image actions
- `src/components/organisms/AcademicNewSectionModal.tsx` and name fields
- `src/components/organisms/AcademicSectionPageHeader.tsx`
- `src/components/organisms/AcademicSectionSettingsSummary.tsx`
- `src/components/molecules/TeacherSectionCard.tsx`
- `src/components/register/SectionEnrollmentLinkCard.tsx`
- `src/components/molecules/SectionEnrollmentLinkPanel.tsx`
- `src/components/molecules/AdminSectionCard.tsx`
- `src/lib/academics/loadAdminCohortPageData.ts` + teacher sections page selects
- Dictionaries `es` / `en` / `pt`

## Non-goals

- Custom share text per section.
- Storing the slug, expiry, or per-family links.
- Changing lead insert, accept, or `inscriptions_enabled`.
- Showing the generic fallback in product UI.
- Photos on `/register` dropdown options, finance, email, or the registrations inbox table.
- Teacher upload.
- Indexing invite links in search engines.
