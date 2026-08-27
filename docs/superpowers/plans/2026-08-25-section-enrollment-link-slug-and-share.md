# Section enrollment link slug, share metadata, and photo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrollment links become `/{locale}/i/{slug}/{uuid}`, WhatsApp shows section + cohort + schedule plus a photo (or the generic fallback), and an optional admin photo appears on section identity surfaces.

**Architecture:** UUID remains the only lookup key. A shared path helper builds/parses the pretty URL. `resolve_section_enrollment_link` also returns `reference_image_path`. Admin writes go through service-role storage on public bucket `section-images`. Old `/i/{uuid}` and stale slugs `permanentRedirect` to the current path.

**Tech Stack:** Next.js App Router, Supabase SQL/RPC/Storage, Vitest, Playwright, dictionaries es/en/pt.

**Spec:** [`docs/superpowers/specs/2026-08-25-section-enrollment-link-slug-and-share-design.md`](../specs/2026-08-25-section-enrollment-link-slug-and-share-design.md)

## Global Constraints

- Stay on `main` (rule 38). Do not create worktrees or feature branches.
- Do not fork `RegisterForm` (rule 28).
- Image uploads use `InlineUploadProgressBar` + dictionary phase labels (rule 01).
- 250-line file ceiling (rule 03). Copy in es/en/pt (rule 09).
- Additive migration only (rule 21). `anon` still has no `SELECT` on `academic_sections`.
- Invite pages stay `robots: { index: false, follow: false }`.
- JPEG/PNG/WebP only, max 2 MiB. No SVG.
- Fallback illustration is share-only; UI shows a photo only when `reference_image_path` is set.
- User rule: do not commit unless the user asks (skip per-task commits in this session).

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/site/slugifyPublicPathSegment.ts` | Shared slug; `slugifyEventTitle` wraps it |
| `src/lib/register/sectionEnrollmentLinkPath.ts` | Build/parse `/{locale}/i/{slug}/{token}` |
| `src/lib/register/sectionReferenceImage.ts` | Bucket, MIME, size, public URL, fallback path |
| `src/lib/register/buildSectionEnrollmentLinkShareMetadata.ts` | Title, description, cover URL |
| `src/lib/register/persistSectionReferenceImage.ts` | Admin-only upload/replace/remove |
| `supabase/migrations/189_section_reference_image.sql` | Column, RPC, bucket |
| `public/images/section-share-fallback.png` | Generic OG image |
| `src/app/[locale]/i/[slug]/[token]/page.tsx` | Canonical public page + metadata |
| `src/app/[locale]/i/[token]/page.tsx` | Redirect or unavailable |
| `src/components/molecules/SectionReferenceThumb.tsx` | Shared thumbnail |

---

### Task 1: Slug and path helpers

**Files:**
- Create: `src/lib/site/slugifyPublicPathSegment.ts`
- Create: `src/lib/register/sectionEnrollmentLinkPath.ts`
- Modify: `src/lib/events/slugifyEventTitle.ts`
- Test: `src/__tests__/lib/register/sectionEnrollmentLinkPath.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `slugifyPublicPathSegment(value: string): string`
  - `buildSectionEnrollmentLinkPath(locale: string, sectionName: string, token: string): string` → `/{locale}/i/{slug}/{token}`
  - `parseSectionEnrollmentLinkSegments(parts: string[]): { slug: string | null; token: string } | null`
  - Empty slug → `seccion`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";
import {
  buildSectionEnrollmentLinkPath,
  parseSectionEnrollmentLinkSegments,
} from "@/lib/register/sectionEnrollmentLinkPath";

const TOKEN = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("sectionEnrollmentLinkPath", () => {
  it("slugifies like event titles and falls back to seccion", () => {
    expect(slugifyPublicPathSegment("  Niño & Música 2026 ")).toBe("nino-musica-2026");
    expect(slugifyPublicPathSegment("!!!")).toBe("");
  });

  it("builds locale/slug/uuid and parses one or two segments", () => {
    expect(buildSectionEnrollmentLinkPath("es", "Kids A1", TOKEN)).toBe(
      `/es/i/kids-a1/${TOKEN}`,
    );
    expect(buildSectionEnrollmentLinkPath("es", "!!!", TOKEN)).toBe(
      `/es/i/seccion/${TOKEN}`,
    );
    expect(parseSectionEnrollmentLinkSegments([TOKEN])).toEqual({
      slug: null,
      token: TOKEN,
    });
    expect(parseSectionEnrollmentLinkSegments(["kids-a1", TOKEN])).toEqual({
      slug: "kids-a1",
      token: TOKEN,
    });
    expect(parseSectionEnrollmentLinkSegments(["nope"])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/register/sectionEnrollmentLinkPath.test.ts`
Expected: FAIL cannot find module

- [ ] **Step 3: Implement helpers; wrap `slugifyEventTitle`**

```ts
export function slugifyEventTitle(value: string): string {
  return slugifyPublicPathSegment(value);
}
```

- [ ] **Step 4: Run tests to verify they pass** (path + existing `eventsPureUtils` slug case)

- [ ] **Step 5: Commit** — skip unless the user asks

---

### Task 2: Image URL + share metadata

**Files:**
- Create: `src/lib/register/sectionReferenceImage.ts`
- Create: `src/lib/register/buildSectionEnrollmentLinkShareMetadata.ts`
- Test: `src/__tests__/lib/register/buildSectionEnrollmentLinkShareMetadata.test.ts`
- Test: `src/__tests__/lib/register/sectionReferenceImage.test.ts`

**Interfaces:**
- Produces:
  - `SECTION_IMAGES_BUCKET = "section-images"`
  - `SECTION_SHARE_FALLBACK_PATH = "/images/section-share-fallback.png"`
  - `ALLOWED_SECTION_IMAGE_MIME`, `MAX_SECTION_IMAGE_BYTES = 2 * 1024 * 1024`
  - `sectionReferenceImagePublicUrl(path: string | null | undefined): string | null`
  - `isAllowedSectionImageUpload(mime: string, size: number): boolean`
  - `buildSectionEnrollmentLinkShareMetadata(input): { title, description, path, coverImageUrl }`
    - `title` = `{sectionName} · {brandName}`
    - `description` = cohort + ` · ` + `Lun 18:00–19:30, Mié 09:00–10:00` (omit empty parts)
    - `coverImageUrl` = photo public URL or `SECTION_SHARE_FALLBACK_PATH`
    - never includes seats

- [ ] **Step 1: Write failing tests** for public URL (mock `readSupabasePublicEnv`), MIME gate, title/description/fallback, no seats in description

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Implement** using `sectionScheduleWeekdayKey` and `toAbsoluteShareUrl` only inside `generateMetadata` via `buildPublicShareMetadata({ coverImageUrl, fallbackImageUrl })` — the share builder returns the raw cover (photo or fallback path)

- [ ] **Step 4: Run tests PASS**

- [ ] **Step 5: Commit** — skip unless asked

---

### Task 3: Migration 189

**Files:**
- Create: `supabase/migrations/189_section_reference_image.sql`
- Test: `src/__tests__/db/section_reference_image_migration.test.ts`

**Interfaces:**
- Produces: `academic_sections.reference_image_path TEXT NULL`; `resolve_section_enrollment_link` also returns `reference_image_path TEXT`; bucket `section-images` public-read; insert/update/delete policies require `is_admin`

- [ ] **Step 1: Write file-text tests** asserting column, `s.reference_image_path` in the function body, `GRANT EXECUTE` to anon, `REVOKE SELECT` is not re-granted, bucket `public`, no `GRANT ALL` on the table to anon

- [ ] **Step 2: Run to verify fail**

- [ ] **Step 3: Write migration** (`CREATE OR REPLACE` the resolve function with the extra column in `RETURNS TABLE` and `SELECT`)

- [ ] **Step 4: Run tests PASS**

- [ ] **Step 5: Commit** — skip unless asked

---

### Task 4: Loader + persist helpers

**Files:**
- Modify: `src/lib/register/sectionEnrollmentLink.ts` — add `referenceImagePath: string | null`
- Modify: `src/lib/register/loadSectionEnrollmentLink.ts`
- Create: `src/lib/register/persistSectionReferenceImage.ts`
- Modify: `src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts`
- Test: `src/__tests__/lib/register/persistSectionReferenceImage.test.ts`

**Interfaces:**
- `persistSectionReferenceImage({ admin, sectionId, bytes, mime })` → `{ ok: true, path } | { ok: false }`
- `removeSectionReferenceImage({ admin, sectionId, previousPath })` → `{ ok: boolean }`
- Path: `{sectionId}/{Date.now()}.{ext}`

- [ ] **Step 1: Extend loader tests** so mapped context includes `referenceImagePath: "sec/1.jpg"` and `null` when missing

- [ ] **Step 2: Fail, then map `reference_image_path`**

- [ ] **Step 3: Persist tests** — reject bad MIME; upload then update column; replace deletes previous object

- [ ] **Step 4: Implement persist with `createAdminClient` caller (actions pass admin)**

- [ ] **Step 5: Commit** — skip unless asked

---

### Task 5: Admin actions + create

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/academic/sectionActions.ts`
- Create: `src/app/[locale]/dashboard/admin/academic/sectionReferenceImageActions.ts`
- Modify: `src/__tests__/app/academicSectionActions.test.ts`
- Test: `src/__tests__/app/sectionReferenceImageActions.test.ts`

**Interfaces:**
- `createAcademicSectionAction` gains optional `imageBase64?: string; imageMime?: string`
- Returns `{ ok: true, id, imageSaved: boolean } | { ok: false }`
- `uploadSectionReferenceImageAction({ locale, sectionId, imageBase64, imageMime })`
- `removeSectionReferenceImageAction({ locale, sectionId })`
- Both `assertAdmin` only

- [ ] **Step 1: Failing tests** — teacher/`assertAdmin` throw → forbidden; invalid MIME → `{ ok: false }`; create without image → `imageSaved: false`

- [ ] **Step 2: Implement**

- [ ] **Step 3: Run PASS**

---

### Task 6: Public routes and metadata

**Files:**
- Create: `src/lib/register/buildSectionEnrollmentLinkPageMetadata.ts`
- Create: `src/app/[locale]/i/[slug]/[token]/page.tsx`
- Modify: `src/app/[locale]/i/[token]/page.tsx`
- Copy: `docs/superpowers/specs/assets/2026-08-25-section-share-fallback.png` → `public/images/section-share-fallback.png`
- Test: `src/__tests__/lib/register/buildSectionEnrollmentLinkPageMetadata.test.ts`
- Modify: `e2e/section-enrollment-link.spec.ts` — URL is `/{locale}/i/{slug}/{uuid}`; token is the last segment; also open old `/{locale}/i/{uuid}` and expect the form

**Interfaces:**
- Canonical page: resolve token; if slug ≠ current, `permanentRedirect` to `buildSectionEnrollmentLinkPath`
- Legacy page: if valid, `permanentRedirect` to pretty path; else unavailable
- `generateMetadata` uses share builder + `buildPublicShareMetadata` + noindex

- [ ] **Step 1: Metadata helper tests** (unavailable vs valid)

- [ ] **Step 2: Implement pages** (extract shared render from current `[token]/page.tsx`)

- [ ] **Step 3: Update e2e regex**

---

### Task 7: UI — photo on identity surfaces + pretty copy URL

**Files:**
- Create: `src/components/molecules/SectionReferenceThumb.tsx`
- Create: `src/components/molecules/SectionReferenceImageField.tsx` (file + `InlineUploadProgressBar`)
- Modify: `AcademicNewSectionModal`, types, `NewSectionTeacherAndNameFields` (or compose the image field under the name)
- Modify: `AcademicSectionPageHeader`, `AcademicSectionSettingsSummary`
- Modify: `AdminSectionCard`, `TeacherSectionCard`, `SectionEnrollmentLinkCard`
- Modify: `SectionEnrollmentLinkPanel` — new required `sectionName: string`; URL via `buildSectionEnrollmentLinkPath`
- Modify loaders/selects: `loadAdminSectionPageData`, `loadAdminCohortPageData`, teacher sections list + detail
- Modify: existing component tests + panel test (`/es/i/kids-a1/{TOKEN}` when name is `Kids A1`)
- Dictionaries es/en/pt: photo labels + upload progress + `shareTitle`/`shareText` if needed for `navigator.share`

**Rules:** photo optional at create; preview chosen file; no generic thumb in UI; teacher cannot upload.

- [ ] **Step 1: Failing UI tests** (card/header/panel)

- [ ] **Step 2: Implement**

- [ ] **Step 3: Run the touched test files**

---

### Task 8: Verify

Run:

```bash
npx vitest run src/__tests__/lib/register/sectionEnrollmentLinkPath.test.ts src/__tests__/lib/register/buildSectionEnrollmentLinkShareMetadata.test.ts src/__tests__/lib/register/sectionReferenceImage.test.ts src/__tests__/lib/register/loadSectionEnrollmentLink.test.ts src/__tests__/lib/register/persistSectionReferenceImage.test.ts src/__tests__/db/section_reference_image_migration.test.ts src/__tests__/app/academicSectionActions.test.ts src/__tests__/app/sectionReferenceImageActions.test.ts src/__tests__/components/SectionEnrollmentLinkPanel.test.tsx src/__tests__/components/register/SectionEnrollmentLinkCard.test.tsx src/__tests__/components/AcademicNewSectionModal.test.tsx src/__tests__/lib/events/eventsPureUtils.test.ts
```

Expected: all PASS.

Apply migration locally when implementing against a tenant DB (`sql:apply-migration` / project script). Do not apply to all tenants unless the user asks.

---

## Self-review

1. **Spec coverage:** pretty URL + redirect, share title/description/image, optional admin photo, identity surfaces, fallback share-only, no seats in OG, anon still cannot SELECT sections, e2e URL — each has a task.
2. **Placeholders:** none.
3. **Types:** `referenceImagePath`, `imageSaved`, `buildSectionEnrollmentLinkPath` names are consistent across tasks.
