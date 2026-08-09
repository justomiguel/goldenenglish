# Section enrollment link: teachers invite families to a section

**Date:** 2026-08-08
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-07-event-packages-registrations-contact-student-care-design.md`](2026-08-07-event-packages-registrations-contact-student-care-design.md) — the admin registrations inbox this feature feeds, and the `contacted_at` / `contacted_by` tracking added in migration 176.
- [`2026-07-23-section-students-enroll-modal-design.md`](2026-07-23-section-students-enroll-modal-design.md) — the admin enrolment modal that remains the only way a lead becomes a `section_enrollments` row.
- [`2026-07-24-tenant-parent-synthetic-email-design.md`](2026-07-24-tenant-parent-synthetic-email-design.md) — the synthetic email rules for minors that the token form reuses unchanged.

**Governing rules:** `28-tenant-register-surface.mdc` (every tenant gets its branded registration surface; forking `RegisterForm` is forbidden), `09-i18n-copy.mdc`, `04-security.mdc`, `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `03-architecture.mdc` (250-line ceiling).

## Intent

A teacher who is opening a new section knows which families should be in it, but has no way to bring them in. Today the only paths into a section are an admin typing the student by hand, an admin importing a CSV, or a family finding the public `/register` form and guessing the right section from a dropdown. All three put the burden of data entry on staff and all three are error-prone about which section the student meant.

This spec gives each section a shareable link. The teacher copies it from the section page and sends it to the family group. The family opens it, sees the section they are joining, fills in their own data, and lands in the admin inbox as a lead already bound to that section.

The teacher stops transcribing. The family types its own name, document and phone. The admin keeps the final say.

## Context

### What exists today

`/[locale]/register` renders `RegisterForm`, which posts to `submitPublicRegistration` in `src/app/[locale]/register/actions.ts`. That action gates on the `inscriptions_enabled` key in `site_settings`, validates the chosen section through the `registration_public_section_label` RPC — which only accepts sections whose cohort has `is_current = true` — and inserts a row into `registrations` with `status: 'new'` and `preferred_section_id` set.

The form already handles everything hard about family data: the Zod schema in `buildPublicRegistrationSchema`, the age computation in `fullYearsFromIsoDate`, the tutor fieldset that appears for minors, and the synthetic student email with up to sixteen retries on DNI collision.

`/register` is not one page but a dispatcher. It reads the active theme's `templateKind` and returns one of six branded surfaces — `RegisterEspacioZenitSurface`, `RegisterMozarthitosSurface`, `RegisterNagoSurface`, `RegisterMiMundoSurface`, `RegisterLioraSurface`, or the inline classic layout — each wrapping `RegisterForm` in its own font root and chrome. All six pass `RegisterForm` the same four props: `locale`, `dict.register`, `legalAgeMajority` and `sectionOptions`. Rule `28-tenant-register-surface.mdc` makes this mandatory: a registration surface must never fall back to the classic Golden English layout on a branded tenant, and `RegisterForm` must not be forked per tenant.

Nothing after that is automatic. An admin opens `/dashboard/admin/registrations`, runs `acceptRegistration` to create the auth user and profile, links the tutor through `tutor_student_rel` when the student is a minor, and then, as a separate action, enrols the student into the section.

A teacher can do none of it. `resolveTeacherPortalAccess` gets them into their own sections, where they can take attendance, grade and request a transfer, but section membership is admin territory.

### The pattern to copy

Student badges already solve "public page behind an unguessable token": a `public_share_token` UUID column, a `SECURITY DEFINER` RPC (`get_public_student_badge_share`) granted to `anon`, a thin loader (`loadPublicStudentBadgeShareByToken`) that validates the token shape before hitting the database, and a public route. This spec follows that shape rather than inventing a second one.

### The load-bearing decision

A link produces a **lead**, not an enrolment. Capacity limits, the section `billing_mode` and enrolment fees added in migrations 178–180, duplicate documents, and the family-to-student links all need a human. Making the link write directly into `section_enrollments` would route around every one of those. The teacher's win is that they no longer transcribe data; the admin's review is cheap by comparison.

## Decisions

| Topic | Choice |
|-------|--------|
| What a submission creates | A `registrations` row with `status: 'new'`, exactly like the public form |
| Token storage | Columns on `academic_sections`. One link per section |
| Token shape | `gen_random_uuid()`, validated as a UUID before any query |
| Public route | `/[locale]/i/[token]` |
| Relationship to `inscriptions_enabled` | Independent. An active token is its own authorisation |
| Relationship to `is_current` | Independent. The token names the section directly |
| Who can create and revoke | The section's teacher, and any admin |
| Section field on the token form | Fixed and read-only. No dropdown, no "undecided" option |
| Tenant branding of the token page | Reuses the six existing `/register` surfaces through an extracted dispatch. `RegisterForm` is extended with one optional prop, never forked (rule 28) |
| Full section | Submission still accepted, family told it may be a waiting list |
| Archived section | Link stops working |
| Revocation | Deactivate keeps the token, rotate issues a new one and kills the old |
| Attribution | `registrations.source_section_link_id` records which section's link produced the lead |
| Teacher visibility | A count of pending leads for their section. No personal data before the admin accepts |
| Rate limiting | Out of scope for this iteration. See Non-goals |

## Architecture

### Database — migration `182_section_enrollment_links.sql`

**The token lives in its own table, not on `academic_sections`.** The first implementation attempt put three token columns on the sections table and a probe against the local database proved that unusable: migration 166 runs `GRANT ALL ON ALL TABLES IN SCHEMA public TO anon`, and row-level security filters rows, not columns. Any section row an anonymous visitor may read exposes every column of that row, so the token of any section in the current cohort could be read — and therefore harvested in bulk — with a single anonymous query. That defeats the entire premise of an unguessable link.

| Column | Type | Meaning |
|--------|------|---------|
| `section_id` | `UUID` primary key, references `academic_sections(id) ON DELETE CASCADE` | One link per section |
| `token` | `UUID NOT NULL DEFAULT gen_random_uuid()`, unique | The secret |
| `is_active` | `BOOLEAN NOT NULL DEFAULT true` | Deactivating keeps the row so the link can be turned back on |
| `created_by` | `UUID` references `profiles(id) ON DELETE SET NULL` | Who generated the current token |
| `created_at`, `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |

The table has row-level security enabled and **no policies at all**, so it is default-deny, and it explicitly revokes every privilege from `anon` and `authenticated`. The explicit revoke is not redundant: migration 166's `ALTER DEFAULT PRIVILEGES` grants `ALL` on newly created tables to both roles automatically, so a new table is exposed the moment it is created unless the migration says otherwise.

Every read therefore goes through a `SECURITY DEFINER` function, and every write goes through the service-role client behind a server-side authorization gate. The raw token is never reachable over PostgREST by any browser session.

One column on `registrations`:

| Column | Type | Meaning |
|--------|------|---------|
| `source_section_link_id` | `UUID` references `academic_sections(id) ON DELETE SET NULL` | The section whose link produced this lead. `NULL` for the public form |

Indexed partially, `WHERE source_section_link_id IS NOT NULL`.

### Database — RPCs

**`resolve_section_enrollment_link(p_token uuid)`** — `STABLE SECURITY DEFINER`, granted to `anon` and `authenticated`. Returns one row of `(section_id, section_name, cohort_name, schedule_slots, seats_remaining)` when the token exists in `section_enrollment_links`, `is_active` is true, the section's `archived_at` is null and the cohort's `archived_at` is null. Otherwise it returns no rows. `seats_remaining` is `max_students` minus the count of `section_enrollments` with `status = 'active'`, and is null when `max_students` is null.

**`section_enrollment_link_is_open(p_section_id uuid, p_token uuid)`** — `STABLE SECURITY DEFINER`, granted to `anon`. A boolean used by the insert path and by RLS to confirm that a given section is currently accepting submissions through a given token.

**`section_enrollment_link_lead_count(p_section_id uuid)`** — `STABLE SECURITY DEFINER`, granted to `authenticated`. Returns the number of `registrations` rows with that `source_section_link_id` and `status <> 'enrolled'`. RLS on `registrations` is admin-only, so without this the teacher panel has no way to show its count; the function checks internally that the caller is an admin or leads the section, and returns zero otherwise. It exposes a count and nothing else — no names, no documents, no contact details.

**`section_enrollment_link_state(p_section_id uuid)`** — `STABLE SECURITY DEFINER`, granted to `authenticated`. Returns `(token, is_active, lead_count)` for the teacher and admin panels, and no rows when the caller is neither an admin nor staff of that section. This function exists because the token table is unreachable over PostgREST by design: without it the panel would have no way to display the very link it manages. It folds in the lead count so the panel needs one round trip rather than two.

All four functions set `search_path = public` and are commented, matching the conventions in migration 030. Writes — generate, deactivate, rotate — need no RPC: the server actions already authorize the caller and then use the service-role client, which keeps its grant on the table.

### Database — RLS

Migration 030 widened the `anon` read policy on `academic_sections` so that inserting `registrations.preferred_section_id` would pass its foreign key check, and migration 034 later tightened it with archive guards. A probe on the local database settled whether any of that is still needed: **it is not**. With `SELECT` revoked from `anon` entirely, `list_registration_section_options()` and `resolve_section_enrollment_link()` both still return rows, because they are `SECURITY DEFINER`, and the anonymous insert into `registrations` still succeeds, because PostgreSQL's referential integrity checks bypass row security exactly as documented. Migration 030's comment claiming otherwise is wrong.

So the migration **revokes `SELECT` on `academic_sections` from `anon`**. Every one of the 68 direct reads of that table in `src/` is on an authenticated path — teacher, admin, parent, student, assistant, admin API — and no public surface reads it except through a definer function.

This closes a pre-existing hole that predates the feature: because grants are table-wide and RLS filters only rows, anonymous visitors could read *every column* of every current-cohort section, not just the identity the policy was written to expose. The repo owner chose to fix it inside this change rather than defer it.

The `academic_cohorts` policy is deliberately left alone. Making it reference `academic_sections` while the sections policy already references cohorts would close an RLS cycle, the failure mode migration 177 had to repair.

One trap worth recording for anyone re-verifying this on another tenant: `INSERT ... RETURNING` fails under `anon` for an unrelated reason, because `RETURNING` needs a `SELECT` policy. Probe without `RETURNING` or you will get a convincing false positive.

Generating, rotating and deactivating a token writes to `section_enrollment_links`, which no browser session can reach. Those changes therefore go through a server action that verifies the caller is an admin or leads the section and then uses the service-role client, the same shape `acceptRegistration` already uses. Generate and rotate are the same write — an upsert keyed on `section_id` that issues a fresh token and activates the row — so rotation is simply the case where a row already existed.

### Routes

| Route | Who | Screen |
|-------|-----|--------|
| `/[locale]/i/[token]` | Anyone with the link | Section header plus the enrolment form |

The single-letter prefix mirrors `/[locale]/b/[token]` for badges and keeps the URL short enough to read aloud over the phone.

### Components

The token page must look like the tenant it belongs to, which rules out a standalone layout. It reuses the same six surfaces, driven by one change to `RegisterForm` and one extraction:

**`RegisterForm` gains a single optional prop**, `enrollmentLink`, a plain serialisable object carrying the token and the resolved section. When it is absent the form behaves exactly as today: the `<select>` of `sectionOptions` and a post to `submitPublicRegistration`. When it is present the form renders a read-only card naming the cohort, the section and its schedule instead of the `<select>`, and posts to `submitSectionLinkRegistration`. The form imports both actions and picks between them, so no function crosses the server-to-client boundary and no surface needs to know which mode it is in.

The birth-date picker, the tutor fieldset, the busy state and the success dialog stay shared and untouched. This is an extension of the shared form, not a fork, which is what rule 28 requires.

**The surface dispatch moves out of the page.** The `templateKind` branching currently inlined in `src/app/[locale]/register/page.tsx`, including the classic fallback, becomes `RegisterSurfaceByTemplate`. `/register` and `/i/[token]` both render it. Each of the five branded surfaces adds the same optional `enrollmentLink` prop to its interface and forwards it to `RegisterForm` — one line each, no layout changes. A new tenant surface therefore serves both routes for free, and the rule-28 checklist stays a single list.

New pieces:

| File | Purpose |
|------|---------|
| `src/lib/register/sectionEnrollmentLink.ts` | The `SectionEnrollmentLinkContext` type shared by the loader, the form and the surfaces |
| `src/lib/register/loadSectionEnrollmentLink.ts` | Token shape check, then the resolve RPC. Mirrors `loadPublicStudentBadgeShareByToken` |
| `src/components/organisms/RegisterSurfaceByTemplate.tsx` | The `templateKind` dispatch, extracted from the register page and shared by both routes |
| `src/components/register/SectionEnrollmentLinkCard.tsx` | The read-only section card that replaces the `<select>` |
| `src/app/[locale]/i/[token]/page.tsx` | Public page. Unavailable state when the loader returns null |
| `src/app/[locale]/i/[token]/actions.ts` | `submitSectionLinkRegistration` |
| `src/components/molecules/SectionEnrollmentLinkPanel.tsx` | Shared teacher and admin panel: generate, copy, share, deactivate, rotate |
| `src/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions.ts` | Generate, deactivate and rotate, authorised for the section's teacher |

Modified: `src/app/[locale]/register/page.tsx` (delegates to the dispatch), `src/components/register/RegisterForm.tsx` (the optional prop), and the five `Register*Surface.tsx` files (forward the prop).

The token page sets `dynamic = "force-dynamic"` like `/register`, and `robots: { index: false, follow: false }` — unlike `/register`, which is indexed on purpose.

### Data flow

```
Teacher opens their section
  → generates the link (server action verifies they lead the section)
  → copies or shares it

Family opens /es/i/<token>
  → loadSectionEnrollmentLink validates the UUID shape
  → resolve_section_enrollment_link returns the section, or nothing
  → the form renders with the section fixed

Family submits
  → submitSectionLinkRegistration re-resolves the token server-side
  → same Zod schema, same age rules, same synthetic email retries
  → INSERT registrations { status: 'new', preferred_section_id, source_section_link_id }

Admin opens /dashboard/admin/registrations
  → the lead carries a "vía link — <section>" badge
  → acceptRegistration, then enrol into the section, both unchanged
```

The client-side token is a convenience, never an authorisation. `submitSectionLinkRegistration` resolves the token again on the server and derives `preferred_section_id` from that result, ignoring any section id the client may have posted.

## Placement

### Teacher — section page, primary

`/[locale]/dashboard/teacher/sections/[sectionId]` already carries a row of links to attendance, assessments, tasks and contents above the roster. `SectionEnrollmentLinkPanel` goes directly below that row, above `TeacherSectionRoster`.

This is the only screen where the section is unambiguous, so nothing has to be selected and nothing can be mistaken. Before the link exists the panel is a single "Crear link de inscripción" button with one line explaining what it does. After, it shows the URL in a read-only field, a copy button, a share button, the count of families who have already submitted, and a menu holding deactivate and rotate.

Share uses `navigator.share` where available, which is the case on the phones teachers actually use, and falls back to copy.

### Teacher — section list, secondary

`/[locale]/dashboard/teacher/sections` gets a copy-link icon per row, enabled only for sections whose link is active. This exists for the teacher who already knows the link exists and only wants to paste it again.

### Admin — section page

The same panel appears on `/[locale]/dashboard/admin/academic/[cohortId]/[sectionId]`, with deactivate and rotate always available. The teacher shares, the admin governs.

### Admin — registrations inbox

Leads with a `source_section_link_id` show a badge naming the section. The existing section filter keeps working off `preferred_section_id`, which the token path always fills.

## Error handling

Every failure the family can hit renders as its own message on the public page, never a bare 404 and never a stack trace:

| Case | What the family sees |
|------|----------------------|
| Malformed token | "Este link no es válido." Rejected before any query |
| Unknown or rotated token | The same message. Rotation and non-existence are indistinguishable by design |
| Deactivated link | "Las inscripciones por este link están cerradas. Contactá al instituto." |
| Archived section or cohort | The same closed message |
| Section full | The form still renders and still accepts, with a notice that the family may be placed on a waiting list |
| Insert fails | The generic registration error already in the dictionary |
| Duplicate minor email after 16 retries | The existing failure path, unchanged |

Teacher-side, attempting to generate a link for a section the caller does not lead returns a permission error and writes nothing.

Copy in `es`, `en` and `pt` under a new `register.sectionLink` dictionary group.

## Testing

**Unit (Vitest)**

- **Against a real database, not a text fixture:** that `anon` and `authenticated` are both denied on `section_enrollment_links`, that `anon` is denied on `academic_sections`, and that the public RPCs still return rows. The original column-based design passed every file-text assertion while leaking every live token; only a real query caught it. Any future change to the grants must be re-probed the same way.
- `loadSectionEnrollmentLink`: malformed token short-circuits before the client is built; RPC error yields null; a valid row maps to the typed shape.
- `RegisterForm`: without `enrollmentLink` it renders the `<select>`; with it, the read-only card and no `<select>`.
- `RegisterSurfaceByTemplate`: each `templateKind` yields its own surface and the unknown kind falls back to classic, so the extraction cannot silently drop a tenant.
- `submitSectionLinkRegistration`: a section id posted by the client is ignored in favour of the server-resolved one; an inactive token is rejected; a minor submission produces the tutor fields and a synthetic email; the insert carries `source_section_link_id`.
- The token-generation action: a teacher who does not lead the section is rejected; rotation replaces the token and leaves the old one unresolvable.

**End-to-end (Playwright)**

One flow: sign in as a teacher, open a section, generate the link, read the URL, open it in a fresh anonymous context, submit a minor with tutor data, then sign in as an admin and find the lead in the inbox carrying the section badge. A second, shorter flow deactivates the link and confirms the public page shows the closed message.

**Migration**

Applied against the tenant databases with `sql:apply-migration:all-tenants`, as with every migration in this repo.

## Non-goals

- The link never creates an auth user, a profile or a `section_enrollments` row. Admin acceptance stays mandatory.
- No teacher approval step. If admin review becomes the bottleneck, that is a follow-up with its own spec.
- No multiple or per-family links per section, and no expiry dates. Rotation covers the leak case.
- No rate limiting or captcha. The token is unguessable and submissions are inert until an admin acts, so abuse costs an admin a few deletions. If a link leaks publicly and gets flooded, rotation is the answer. Revisit if it happens.
- No email or push notification to the teacher on each submission. The count on the panel is enough.
- The public `/register` form and the `inscriptions_enabled` flag keep their current behaviour.
