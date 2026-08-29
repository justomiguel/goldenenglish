# Admin parents directory and bulk mail

**Date:** 2026-08-28
**Status:** Implementing on main
**Kind:** Design spec. Implementation plan after this file is approved.
**Governing rules:** `03-architecture.mdc` (250-line ceiling), `09-i18n-copy.mdc` (es / en / pt, no hardcoded UI), `30-harness-self-contained-tests.mdc`.

**Related:**

- Students / teachers locked-role directories (`/admin/students`, `/admin/teachers`)
- Admin messages compose (`AdminPortalCompose`, `sendStaffMessageUseCase`)
- `profiles.last_session_start_at` (session_start analytics)
- `isDeliverableAuthEmail` / `isParentSyntheticEmail`
- `notifications.admin_tutor_welcome` (student-create welcome — not reused for this invite)
- `EmailProvider` + Resend (`to` only today)

## Intent

Admins get a **Padres** sidebar section that works like Alumnos, but the job is **who has never opened the platform** and **how to reach them**. From that list they can invite never-logged-in parents (welcome + unique password-reset link) or write a mail to a section / the whole institute, delivered as portal inbox **and** email (CC, BCC, or individual with `{{nombre}}` / `{{apellido}}`).

## Decisions locked

| Topic | Choice |
|-------|--------|
| Course filter | Academic **section** (class), not cohort |
| Never-logged-in invite | One mail: welcome **+** unique recovery link (not two buttons) |
| Custom mail | Shared compose shell; modes CC / BCC / Individual |
| Delivery | Always a `portal_messages` row per parent **and** email when the mailbox is deliverable |
| Compose reuse | Extract a shared shell. Do **not** turn Mensajes 1:1 into a blast form |
| Last access | `profiles.last_session_start_at`. Null = **Nunca**. Do not use `auth.users.last_sign_in_at` |
| Emailable | `isDeliverableAuthEmail`. Synthetic `dni@parents…` stay on the list and get portal only |
| Roles | Same admin gate as Alumnos. No new RBAC |
| Cap | 200 parents per send. If the filter is larger, warn and send the first 200 (stable sort by last name, then id) |

## Done when

1. Sidebar shows **Padres** directly under Alumnos. Opening a `parent` profile highlights Padres and the back-to-list link returns to `/admin/parents`.
2. `/[locale]/dashboard/admin/parents` lists parents with columns: checkbox, name, email (or “sin email”), linked children, those children’s active sections, last access (relative date or **Nunca**).
3. URL filters combine: `q`, `section` (active section id), `access` (`all` \| `never` \| `entered`). Server-side, not current-page only.
4. KPI row: total parents, never entered, deliverable email, new last 30 days.
5. Subnav: List + Add (`/admin/users/new?role=parent`), same as teachers.
6. **Invitar a la plataforma** (selection, or entire filter if none selected) sends the new invite template + unique recovery link per parent. Always individual. Portal message for every selected parent; email only if deliverable.
7. **Enviar mail** opens `/admin/parents/compose` with those recipients. Shared shell: subject, rich body, mode CC / BCC / Individual, recipient summary. Confirm counts before send.
8. Custom send: one `portal_messages` per parent; email follows the mode. Individual substitutes `{{nombre}}` and `{{apellido}}` (HTML-escaped). CC/BCC do not substitute (one body).
9. `SendEmailInput` accepts optional `cc?: string[]` and `bcc?: string[]`. Resend and `RecordingEmailProvider` implement them. Existing 1:1 sends omit them.
10. Mensajes → Redactar behavior is unchanged (single recipient, no subject, portal + notify).
11. Isolated tests cover extras, filters, synthetic skip, personalization, CC/BCC payload, invite-never-CC, and 1:1 compose still taking one `recipientId`.

## Out of scope

- New permission layers or teacher access to this page
- Bulk mail to students, teachers, or mixed roles
- Editing the student-create welcome template as part of this work
- Cohort-level filter (section only)
- Showing `auth.users.last_sign_in_at`
- Putting never-logged-in invites on CC/BCC
- Changing portal messaging schema (still 1:1 `portal_messages` rows)
- Migrations (no new tables)

## Approaches considered

1. Inflate `AdminPortalCompose` with blast modes. Rejected: that page is 1:1 including site-visitor reply.
2. Brand-new parents-only composer. Rejected: duplicates the editor the product already has.
3. **Extract `AdminComposeShell` and parameterize (chosen).** Messages stays 1:1. Parents compose is bulk. Shared editor, send button, card chrome.

## List page

**Route:** `/{locale}/dashboard/admin/parents`  
**Pattern:** `AdminPageHeader` + `AdminPeopleStatsRow` (or the same KPI cards) + `AdminUsersScreen` with `lockRole="parent"`.

**Sidebar:** new item in `buildAdminDailyNavItems` immediately after students. New `adminSurfaceIcon` id `parents` (Lucide `UsersRound`). i18n: `adminNav.parents`, `tipParents`.

**Active / back link:** `isAdminSidebarNavItemActive` and `adminPersonRecordListHref` map `role === "parent"` to `/parents`.

**Columns (parents directory only)**

| Column | Source |
|--------|--------|
| Checkbox | Existing `AdminUsersDataTable` selection |
| Name | `profiles`, link to `/admin/users/{id}` |
| Email | Auth email. If not `isDeliverableAuthEmail`, show the empty-email label (not the synthetic address) |
| Children | `tutor_student_rel` → student names |
| Sections | Distinct active `section_enrollments` of those children |
| Last access | `last_session_start_at` formatted relative to locale, or **Nunca** |
| Actions | Same open-profile action as other directories |

**Filters (query params)**

| Param | Values |
|-------|--------|
| `q` | Existing people search (name, phone, full email) |
| `section` | Active `academic_sections.id` or absent |
| `access` | `all` (default), `never` (`last_session_start_at` is null), `entered` (not null) |
| `page`, `sort`, `dir` | Same as students. Allow sort by `name` and `lastAccess` |

Section filter: parent is included if **any** linked student has an **active** enrollment in that section.

**Selection for actions**

- Checkboxes on the current page work as today.
- If **at least one** row is checked, actions use those ids (max 200).
- If **none** are checked, actions resolve the **full current filter** on the server (not only the page), then cap at 200.

**Toolbar actions**

1. **Invitar a la plataforma** — no composer. Confirm: count + “solo quienes nunca ingresaron se invitan” if the filter is mixed? **Normative:** invite runs on the current selection/filter **as-is**. The admin uses the `access=never` filter when they want only never-entered. Do not silently drop parents who already entered.
2. **Enviar mail** — navigate to compose with the recipient scope.

**Empty / zero recipients:** disable both actions when the resolved set is empty.

## Compose (bulk)

**Route:** `/{locale}/dashboard/admin/parents/compose`

**Recipient scope in the URL (one of):**

- `ids=uuid,uuid,…` — explicit selection (max 200, all must be `role=parent`)
- `scope=filter` plus the same `q`, `section`, `access` as the list

The send action **re-resolves** this scope on the server. Client ids that are not parents, or no longer match the filter, are dropped.

**Shell (`AdminComposeShell`)**

Shared presentational form: optional subject, `RichTextEditor`, submit, busy/error. Props distinguish:

| | Messages 1:1 | Parents bulk |
|--|--|--|
| Recipient UI | Existing `RecipientAutocomplete` | Read-only list + counts |
| Subject | Hidden | Required |
| Mode radios | Hidden | CC / BCC / Individual |
| Success | Existing `successNavigateTo` messages list | Back to `/admin/parents` with the same list filters |

`AdminPortalCompose` becomes a thin wrapper around the shell (recipient picker + `sendAdminMessage`). No CC/BCC there.

**CC:** one email. `to` = `RESEND_FROM_EMAIL`. `cc` = deliverable parent emails. If Resend rejects To=From, fallback: `to` = first deliverable parent, `cc` = the rest.

**BCC:** one email. `to` = `RESEND_FROM_EMAIL`. `bcc` = deliverable parent emails. Same To=From fallback: `to` = first, `bcc` = rest.

**Individual:** one email per deliverable parent. Replace `{{nombre}}` and `{{apellido}}` in subject and HTML. Unknown placeholders stay as written.

**Portal:** insert `portal_messages` directly (one row per parent, including synthetic). Do **not** call `sendStaffMessageUseCase` — that helper also sends a portal-notify email and would double-mail on Individual and add a second mail per parent on CC/BCC. Body = the composed HTML. For Individual, substitute names in the portal body too. For CC/BCC, same body for everyone. No portal “CC” — each row is 1:1 from the admin.

**Confirm line before send:** `{n} padres · {e} con email · {p} solo portal`.

## Invite (welcome + reset)

New branded template key: `notifications.parent_platform_invite`.

Placeholders: `nombre`, `apellido`, `greetingName` (first name), `portalUrl`, `resetUrl`.

Do **not** change `notifications.admin_tutor_welcome` (still used when creating a student).

Per parent:

1. `auth.admin.generateLink({ type: "recovery" })` → unique `resetUrl`
2. Portal message with the filled, sanitized HTML (includes that parent’s `resetUrl`)
3. Email via `sendBrandedEmail` only if deliverable
4. Never CC/BCC, never one shared reset link
5. Same as bulk mail: insert `portal_messages` directly. Do not go through `sendStaffMessageUseCase`.

Respect existing email send gates (`emailSendsEnabled` / per-template flag). If the template is disabled, still write portal messages and report “solo portal”.

## Data flow

```
List filters / checkboxes
  → resolveParentRecipients(admin, scope)  // profiles + extras + emails
  → Invitar: inviteParentsToPlatform
  → Enviar mail: GET compose?scope…
       → AdminComposeShell
       → sendParentBulkCommunication
            → sanitize HTML
            → insert portal_messages (batch)
            → EmailProvider.sendEmail in chunks of 50
            → recordSystemAudit
            → return { portalOk, emailed, skippedSynthetic, failed }
```

Emails come from `auth.admin.getUserById` (same as the rest of admin people). Do not persist extra copies.

`loadAdminParentDirectoryExtras(admin, parentIds)` loads children, sections, last access (already on profile), and deliverable-email flags for the current page.

## Errors

| Case | Behavior |
|------|----------|
| Not signed in / not admin | Same codes as `sendAdminMessage` |
| Empty subject or empty body (bulk mail) | Reject, no writes |
| Empty invite/mail set | Reject |
| One email fails in a chunk | Continue; count as `failed`; portal row still created if insert succeeded |
| Portal insert fails for one parent | Skip that parent’s email; count persist failure |
| All synthetic | Portal only; success with skipped count |
| Over 200 | Trim with warning in the confirm UI and the action result |

## Testing

Self-contained unit tests (no live Resend, no shared fixture files):

- `loadAdminParentDirectoryExtras`: children, distinct sections, `never` vs dated access, synthetic vs deliverable
- Recipient resolve: `section` join, `access=never`, cap 200
- `isDeliverableAuthEmail` already exists — assert bulk builder omits synthetics from `to`/`cc`/`bcc` and still lists them for portal
- Individual fill: `{{nombre}}` / `{{apellido}}` escaped
- CC/BCC: provider receives one call with the arrays
- Invite: one `generateLink` per parent; provider never called with `cc`/`bcc`
- Bulk and invite do not send the portal-notify mail (`notifyPortalInboxForStudentOrParent`)
- `AdminPortalCompose` / `sendAdminMessage` still accept a single `recipientId`

No new e2e required for this spec.

## File sketch (plan will pin exact paths)

- Create: `src/app/[locale]/dashboard/admin/parents/page.tsx`, `layout.tsx`, `compose/page.tsx`
- Create: `src/lib/dashboard/loadAdminParentDirectoryExtras.ts`
- Create: `src/lib/messaging/useCases/sendParentBulkCommunication.ts`
- Create: `src/lib/email/inviteParentsToPlatform.ts`
- Create: `src/components/dashboard/AdminComposeShell.tsx`
- Modify: `buildAdminDailyNavItems.tsx`, `adminSidebarNavActive.ts`, `adminPersonRecordListHref.ts`, `adminSurfaceIcon.tsx`
- Modify: `AdminUsersDataTable` / row / helpers for `lockRole="parent"`
- Modify: `lockedRoleUsersParams.ts`, `loadPaginatedAdminUsers.ts`, `loadAdminPeoplePageStats.ts`
- Modify: `emailProvider.ts`, `resendEmailProvider.ts`, `recordingEmailProvider.ts`
- Modify: `templateRegistry` + `notifications.parent_platform_invite`
- Modify: `AdminPortalCompose` to wrap the shell
- Modify: `es.json` / `en.json` / `pt.json`
