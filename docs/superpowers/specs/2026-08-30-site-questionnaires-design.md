# Site questionnaires (admin builder, public/private fill, results)

**Date:** 2026-08-30
**Status:** Approved (approach A — dedicated module)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- Event custom fields (`event_form_fields`) — UX reference for add/edit/archive. Do **not** share tables or enums.
- Academic `question_bank_items` — class assessments. Do **not** reuse.
- Blog on landing (`blogEnabled`) — same “omit the section when empty” pattern.
- Admin settings + institute hub “site” group — entry point.
- Recharts + `RechartsSizedFrame` — results charts.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`.

## Intent

Give admins a Google Forms–style tool in **site settings**: create questionnaires with common field types, share a link, optionally surface them on the landing, allow public or login-only access, optionally limit to one response, and read results (charts where they help, tables where they do not) plus CSV.

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | New module. Four tables. No reuse of events or the question bank |
| Admin entry | Card on `/admin/settings` **and** a row in institute hub group `site` |
| Admin routes | `/[locale]/dashboard/admin/settings/questionnaires`, `/[id]`, `/[id]/results` |
| Public route | `/[locale]/q/[slug]` |
| Landing | Optional. `show_on_landing` on the questionnaire. Shared section component; **not** a CMS `LandingBlockKind` |
| Visibility | `public` or `private` (login required). Private + no session → login, then back to `/q/[slug]` |
| One response | Per-questionnaire toggle. Enforced in a transaction (lock the questionnaire row) |
| Languages | Schema is `*_i18n` JSONB. Editor v1 writes only `defaultLocale` (`es`). UI chrome stays in en/es/pt dicts |
| Question types v1 | `text`, `textarea`, `email`, `phone`, `number`, `date`, `yes_no`, `single_choice`, `multi_choice`, `scale` |
| Scale | Always 1–5. Not configurable |
| Files / branching | Out of v1 |
| Publish gate | At least one non-archived question. Choice questions need ≥ 2 non-empty options |
| After answers exist | Cannot change that question’s type or options. Can add questions. Can edit title, description, toggles, status |
| Slug | Locked after first publish |
| Archive | Soft. Archived questionnaires 404 on `/q/[slug]` and drop off landing and the active list |
| Who administers | Admin only (same gate as other settings). Teachers do not create or see results |
| Captcha / rate limit | Out of v1. Admin closes a form if it is spammed |
| Delete responses | Out of v1 |

## Goals

1. Admin can create, edit, publish, close, and archive questionnaires from site settings.
2. Visitors fill a published questionnaire at `/q/[slug]`; private ones require login.
3. Landing shows a section only when at least one published questionnaire has `show_on_landing`.
4. Admin sees per-question charts or lists, individual responses, and can download CSV.
5. Labels and options are stored as i18n JSON so a later editor can add `en` / `pt` without a data migration.

## Non-goals

- File or image uploads
- Conditional logic / branching
- Editing or deleting a submitted response
- Cross-tabulation (“of those who said Yes, what is the average scale?”)
- Live / realtime results
- Date-range filters
- CMS-editable landing copy for the section (dict + questionnaire titles only)
- Sharing the event form builder or academic question bank
- Locale tabs in the v1 editor
- E2E in the critical suite as a v1 blocker (optional later: create → publish → submit → see count)

## Context

Today the closest builder is event registration fields (`text`, `textarea`, `number`, `date`, `email`, `phone`, `select`, `file`, `image`) tied to tickets, capacity, and companions. Settings is a stack of site toggles (inscriptions, CTA mode, email sends). Landing templates already accept optional flags such as `blogEnabled`. Analytics and finance already chart with Recharts.

Questionnaires are site content + ops, not academic assessments and not event enrolment.

## Data model

Next unused migration after current head (203+). Additive only.

### Enums

```
questionnaire_status: draft | published | closed
questionnaire_visibility: public | private
questionnaire_question_type:
  text | textarea | email | phone | number | date
  | yes_no | single_choice | multi_choice | scale
```

### `questionnaires`

| Column | Notes |
|--------|--------|
| `id` | uuid pk |
| `slug` | unique among rows with `archived_at is null`. `[a-z0-9]+(-[a-z0-9]+)*`, 2–80 chars |
| `title_i18n` | jsonb, object of locale → string. v1 writes `{ "es": "..." }` |
| `description_i18n` | jsonb, same shape, may be empty |
| `status` | default `draft` |
| `visibility` | default `public` |
| `limit_one_response` | boolean, default false |
| `show_on_landing` | boolean, default false |
| `created_by` | profiles.id |
| `published_at` | set on first transition to `published`; slug locks once this is non-null |
| `archived_at` | null = active |
| `created_at` / `updated_at` | existing `set_updated_at` trigger |

### `questionnaire_questions`

| Column | Notes |
|--------|--------|
| `id` | uuid pk |
| `questionnaire_id` | fk cascade |
| `question_type` | enum |
| `prompt_i18n` | jsonb, required non-empty in `defaultLocale` |
| `help_text_i18n` | jsonb, optional |
| `options_i18n` | jsonb `Record<locale, string[]>`. Used by `single_choice` and `multi_choice`. Empty object otherwise |
| `required` | boolean, default false |
| `position` | int, list order |
| `archived_at` | soft archive |

No public `field_key`. Internal identity is `id`.

### `questionnaire_responses`

| Column | Notes |
|--------|--------|
| `id` | uuid pk |
| `questionnaire_id` | fk restrict (keep history if a questionnaire is archived) |
| `respondent_user_id` | nullable. Set when the submitter has a session |
| `respondent_email` | nullable. Set when public + `limit_one_response` and no session. Stored lowercased/trimmed |
| `locale` | `es` \| `en` \| `pt` of the page they used |
| `submitted_at` | timestamptz |

A unique index is **not** used for the one-response rule (the toggle can turn off). Enforcement is the submit transaction.

### `questionnaire_answers`

| Column | Notes |
|--------|--------|
| `id` | uuid pk |
| `response_id` | fk cascade |
| `question_id` | fk restrict |
| `value_text` | text, email, phone, date (ISO `YYYY-MM-DD`), `yes` \| `no`, single-choice option string |
| `value_number` | number and scale (1–5) |
| `value_options` | `text[]` for `multi_choice` |

Exactly one value column is populated per type. Unique `(response_id, question_id)`.

### Copy resolution

`pickI18n(map, locale)` → `map[locale]` if non-empty, else `map[defaultLocale]`, else first non-empty value, else `""`.

## RLS

- **questionnaires / questions:** `select` if `archived_at is null` and `status = published` and (`visibility = public` or the caller is authenticated). Admins select all including archived/draft. Insert/update/delete: admin only.
- **responses / answers:** insert allowed when the parent questionnaire is `published` and visibility matches the caller (anon only if `public`). Select: admin, or the row’s `respondent_user_id = auth.uid()`. No client update/delete.
- Submit still goes through a server action (service role or user client inside a transaction). RLS is the backstop, not the only check.

## Routes and UI

### Admin list

`/[locale]/dashboard/admin/settings/questionnaires`

- `AdminPageHeader`, create button, `UniversalListView` card.
- Columns: title, status, visibility, response count, landing flag.
- Row actions: edit, results, copy link (`/{locale}/q/{slug}`), archive (confirm).
- Settings page (`/admin/settings`) gets a card linking here. Institute hub `site` group gets a row. `adminNav` keys stay aligned in en/es/pt.

### Admin editor

`/.../questionnaires/[id]`

Metadata: title, description, slug (read-only after `published_at`), status, visibility, limit-one, show-on-landing.

Questions: ordered list, add, edit, archive, reorder. Add panel: type, prompt, required, plus options only for choice types. Small preview. Same interaction language as `EventFormFieldAddPanel`, new components, no import of event field types.

Caps: 50 non-archived questions per questionnaire; 20 options per choice question.

### Admin results

`/.../questionnaires/[id]/results`

Header: total responses, last `submitted_at`, visibility and limit badges, CSV download.

Per question (position order, including archived questions that have answers):

| Type | View |
|------|------|
| `yes_no`, `single_choice`, `scale` | Horizontal bars via Recharts + `RechartsSizedFrame`. Scale always shows 1–5, including zeros |
| `multi_choice` | Bars. Sum of counts may exceed N |
| `number` | Average, min, max. Histogram only when that question has ≥ 8 numeric answers |
| `text`, `textarea`, `email`, `phone`, `date` | Paginated list (20), no chart |

Each block shows N and percent of respondents who answered that question.

Individual responses: table (submitted_at, respondent label, view). Detail is read-only. 20 per page.

**Respondent label:** profile display name + email if `respondent_user_id`; else `respondent_email`; else the anonymous label from the dict.

**CSV:** UTF-8. Columns: `submitted_at`, `respondent`, then one column per question in position order (archived-with-answers included). `multi_choice` joined with `"; "`. Generated in a server action; not assembled in the browser.

Aggregations run on the server. The results page does not download every answer row to draw charts.

### Public fill

`/[locale]/q/[slug]` — public tenant chrome (same family as blog/events).

| Questionnaire state | Visitor sees |
|---------------------|--------------|
| Missing, archived, `draft`, `closed` | 404 |
| `private`, no session | Login, return to `/q/[slug]` |
| `published`, limit-one already satisfied | “Already submitted” copy, no form |
| `published`, may submit | Title, description, single-page form, submit |

- Session present → do not ask for email; store `respondent_user_id`. Limit-one matches on that user id.
- No session + public + limit-one → email field first, required, normalized. Limit-one matches on that email.
- No session + public + unlimited → no email; anonymous response allowed.

Success: redirect to `?done=1` on the same path (thank-you, no re-POST).

Validation: required fields; email format; phone at least 6 digits after stripping spaces; number finite; date ISO; scale integer 1–5; `yes_no` only `yes`/`no`; choice values must be an exact current option string.

Submit error codes: `not_found`, `closed`, `login_required`, `already_submitted`, `validation`, `invalid_option`.

Limit-one race: `BEGIN`; `SELECT … FOR UPDATE` on the questionnaire; re-check count; insert response + answers; `COMMIT`.

### Landing

Server loads questionnaires where `status = published`, `archived_at is null`, `show_on_landing = true`, ordered by `published_at` desc.

Zero rows → the section is not rendered (all templates).

Otherwise a shared `LandingQuestionnairesSection`: dict heading, one card per item (title via `pickI18n`, lock icon if private, CTA to `/q/[slug]`). Private cards still show; the CTA hits login. Do not add a `LandingBlockKind`. Wire the section through `LandingMainSectionHostProps` the same way as `blogEnabled`.

## Domain rules

- First publish sets `published_at` and freezes the slug.
- `closed` keeps data and admin results; public URL is 404.
- Archiving a **question** hides it from the form and from new submits; historical answers still appear on results and CSV. Un-archive is allowed if the questionnaire is still under the 50-question cap.
- Reordering questions is always allowed (position is display only).
- Archiving a **questionnaire** is soft; responses stay. Un-archive restores it to the active list; `/q/[slug]` follows current status again.
- Changing status, visibility, limit-one, or landing flag is always allowed for admins. Turning limit-one **on** after duplicates exist does not delete extras; it only blocks **new** submits from identities that already have a row.
- Admin mutations write the existing audit log (`resourceType: questionnaire` / `questionnaire_question`).

## Error handling

Admin: duplicate/invalid slug, empty title, publish with zero questions, publish with a choice question that has fewer than two options → stay on the form with a dict error. No silent defaults.

Public submit: map codes to dict strings. Never echo raw Postgres errors.

## Testing

- Migration: tables, enums, RLS, indexes; existing policies on events / `site_settings` / blog stay intact (same regression style as other settings migrations).
- Publish action: reject empty questionnaire and two-option-fail; accept a valid one.
- Submit action: private without login; limit-one second submit (user and email); forged option rejected; closed/draft 404 path.
- Aggregator: `yes_no` / `single_choice` counts; `multi_choice` can exceed N; text types produce no chart series.
- UI: empty list; add-question panel; results render bars vs list from a fixture.
- Critical E2E is not a v1 gate.

## File boundaries (implementation must keep these small)

| Unit | Responsibility |
|------|----------------|
| `src/lib/questionnaires/types.ts` | Enums and DTOs |
| `src/lib/questionnaires/pickI18n.ts` | Copy fallback |
| `src/lib/questionnaires/normalizeSlug.ts` | Slug rules |
| `src/lib/questionnaires/validateAnswers.ts` | Submit payload vs questions |
| `src/lib/questionnaires/aggregateResults.ts` | Server-side chart/list models |
| `src/lib/questionnaires/loadPublicQuestionnaire.ts` | Public page loader |
| `src/lib/questionnaires/loadLandingQuestionnaires.ts` | Landing list |
| `src/app/.../admin/settings/questionnaires/*` | Pages + server actions |
| `src/app/.../q/[slug]/page.tsx` | Public fill |
| `src/components/dashboard/admin/questionnaires/*` | List, editor, results |
| `src/components/organisms/LandingQuestionnairesSection.tsx` | Landing block |

Do not grow `EventFormFieldsEditor` or `site_settings` JSON into a form definition.

## Skills used

Brainstorming for this spec. Implementation should use the Next.js App Router skill, existing admin list-shell patterns, and Recharts as already used. No third-party “survey builder” skill.
