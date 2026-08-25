# Admin view-as role

**Date:** 2026-08-22
**Status:** Approved (implementing)
**Kind:** Full design spec. One product change: replace the two-pill Admin / Teacher workspace switch with a role selector that can open another person’s portal in read-only view-as.

**Related:**

- [`2026-08-21-admin-ops-reskin-design.md`](2026-08-21-admin-ops-reskin-design.md) — current `StaffWorkspaceSwitch` (ADMIN / ÁREA DOCENTE) and teacher-portal header control.
- `src/components/dashboard/StaffWorkspaceSwitch.tsx`, `AdminChromeHeader.tsx`, `TeacherChromeHeader.tsx`
- Portal layouts: `src/app/[locale]/dashboard/{admin,teacher,student,parent,assistant}/layout.tsx`
- People search: `src/lib/dashboard/loadPaginatedAdminUsers.ts`

## Intent

An institute admin needs to see the real UI of each role — teacher, student, parent/tutor, assistant/staff — as a specific person, with that person’s data. Today the header only toggles the admin’s own admin workspace and the admin’s own teacher workspace. Student, parent, and assistant layouts redirect anyone whose profile role does not match.

This spec keeps the admin signed in as themselves. Choosing a person sets a view-as overlay, opens that person’s existing portal routes, loads data as that `userId`, and blocks every write.

## Context

`StaffWorkspaceSwitch` is a two-option segmented control. Admin → `/dashboard/admin`. Teacher → `/dashboard/teacher`. `resolveTeacherPortalAccess` already lets an admin session into the teacher shell; the admin then sees *their* sections (usually none).

Student and parent layouts require `profile.role === "student" | "parent"`. Assistant requires `resolveStaffAssistantPortal`. There is no impersonation, no view-as cookie, and no way to pick a subject.

Profile roles with a portal: `admin`, `teacher`, `student`, `parent`, `assistant`. `site_contact` is a synthetic sender and is already excluded from the people directory.

Many portal loaders already take an explicit `userId` (`loadTeacherDashboardModel`, `loadParentFocusCatalog`, …). Layouts currently pass `auth.uid()`. View-as swaps that id after the session is confirmed to be admin.

## Decisions

| Topic | Choice |
|-------|--------|
| Who can start view-as | Any institute admin session (same people who already see admin chrome). Not teachers, parents, students, or assistants. |
| Picker model | Role first, then person. Admin or Teacher with no person = own workspace (clears view-as). |
| Roles in the selector | Admin, Teacher, Student, Parent/Tutor, Staff (assistant), All |
| Subject | A concrete `profiles` row. Not a fake demo user. |
| Writes | Read-only. Mutations no-op. Write CTAs disabled in UI. |
| Other admins | Never view-as another admin. Picking an admin (including via All) opens the caller’s own admin workspace. |
| Self | Picking yourself is own workspace for that role, not a preview. |
| Excluded people | `site_contact` and the public-contact synthetic profile id (same exclusions as the admin directory). |
| Persistence | Signed `httpOnly` cookie. Survives refresh until Volver a admin, choosing own Admin/Teacher, or sign-out. |
| Auth | Session stays the admin. No token swap, no service-role-as-user. |
| Empty loaders | If a page still keys off `auth.uid()` and shows empty, the nav stays. Fix that loader when it appears; not a v1 blocker. |
| Audit log | Out of scope. |
| PWA | Same web routes; no separate PWA mode. |

## Approaches considered

1. **Overlay on existing portals (chosen).** Cookie + `resolveDashboardActor` + open `/dashboard/{teacher,student,parent,assistant}`. Reuses real chrome and routes. Write risk is a shared `assertNotViewAs` plus disabled CTAs.
2. Preview tree under `/dashboard/admin/view-as/[userId]/…`. Writes isolated by routing, but in-portal links escape unless every href is rewritten. Feels less like the real product.
3. Service-role / RLS override so queries run as the subject. Few loader edits, one missed write changes live data. Rejected.

## Selector

Replaces `StaffWorkspaceSwitch` everywhere it appears today (admin header compact brand; teacher header when the admin workspace is offered). The same control is mounted on student, parent, and assistant chrome **only while view-as is active**, so the admin can change subject or exit without hunting.

Options, in order:

| Option | Without a person | With a person |
|--------|------------------|---------------|
| Admin | Clear cookie. Go to `/dashboard/admin`. | Not offered. An admin row in All is treated as Without a person. |
| Teacher | Opens the same popover as other roles. First row is **Mi área docente**: clear cookie, go to `/dashboard/teacher`. | Cookie for that teacher. Go to `/dashboard/teacher`. |
| Student | Open people search, role `student`. | Cookie. Go to `/dashboard/student`. |
| Tutor | Open people search, role `parent`. | Cookie. Go to `/dashboard/parent`. |
| Staff | Open people search, role `assistant`. | Cookie. Go to `/dashboard/assistant`. |
| All | Open people search, no role filter. | Route from the subject’s role using the table above. |

Search uses the admin people directory query (name / email / DNI), same exclusions. Empty result: empty state, no navigation.

Labels come from existing user-role copy (`roleOptionTeacher`, `roleOptionStudent`, `roleOptionParent`, `roleOptionAssistant`, `roleFilterAll`) plus the current workspace Admin / Área docente strings where they already fit.

## Banner

While `viewAs` is set, every affected shell shows a persistent bar that cannot be dismissed except by exiting:

`Viendo como {displayName} · {roleLabel} · Solo lectura` + **Volver a admin**.

Volver a admin clears the cookie and navigates to `/dashboard/admin`.

## Actor resolution

`resolveDashboardActor` (server, one place):

1. Require an authenticated user.
2. Read the cookie. If missing, `viewerId = session.id`, `viewAs = null`.
3. If the session is not an admin, ignore the cookie (`viewerId = session.id`).
4. Load the subject profile. If missing, excluded, or role `admin`, clear the cookie, `viewerId = session.id`.
5. If `subject.id === session.id`, treat as own workspace and clear the cookie.
6. Otherwise `viewerId = subject.id`, `viewAs = { id, name, role }`.

Layouts:

- **Student / parent:** allow entry when `profile.role` matches **or** (`isAdmin` and `viewAs.role` matches that portal).
- **Assistant:** allow when `resolveStaffAssistantPortal(session)` **or** (`isAdmin` and `viewAs.role === "assistant"`).
- **Teacher:** when `viewAs.role === "teacher"`, allow and pass `viewerId` into teacher loaders. When view-as is set for another role, do **not** use the existing “admins may enter teacher” rule — apply the mismatch row in Error handling. When view-as is unset, today’s admin access stays.
- **Admin:** view-as is not applied to admin pages. Deep-link to `/admin` with a cookie still set leaves the cookie until the selector’s Admin option or Volver a admin clears it.

Pages that already take a `userId` receive `viewerId`. Chrome receives `viewAs` for the banner and selector.

## Cookie

Name: `ge_view_as`. `httpOnly`, `sameSite=lax`, `secure` in production, path `/`. Payload is HMAC-signed (subject id + issued-at) with `CRON_SECRET`, same helper style as blog preview tokens. If `CRON_SECRET` is missing, `startViewAs` fails closed and sets no cookie. Only server actions `startViewAs(userId)` and `clearViewAs()` write it. `startViewAs` no-ops unless the caller is admin and the subject is an allowed non-admin profile. The subject id must not live in a readable client cookie.

## Writes

`assertNotViewAs()` runs at the start of server actions under teacher, student, parent, and assistant portals (tasks, messages, payments, attendance, grades, enrollment links, settings, profile edits, reminders). If view-as is active: no persist, return a read-only error code.

Client: a `viewAs` flag on those shells disables the same CTAs so the admin does not submit and fail.

The admin’s own `/dashboard/admin` actions are not gated. They are unreachable while the cookie is set only by convention (the admin left that shell); if the admin deep-links back to `/admin` without clearing the cookie, admin writes still work. Choosing Admin in the selector always clears first.

## Account sheet and escape hatches (view-as only)

Hide:

- Sign out
- Edit-own-profile / shared `/dashboard/profile`
- Teacher nav item that jumps to admin CMS blog

Keep language switch (admin preference). Exit is Volver a admin or the selector.

## In-scope screens (v1)

Navigate and read the subject’s data:

| Portal | Destinations |
|--------|----------------|
| Teacher | Home, sections, calendar, academics, messages |
| Student | Home, course (progress / tasks / assessments / badges), payments if that profile has the module, messages |
| Parent | Home, child (calendar / progress / feedback and current child prefixes), payments, messages, child/section focus chips |
| Assistant | Home and section prefixes already in assistant nav |

## Out of scope

- Acting as the subject (grades, messages, payments, attendance).
- View-as another admin.
- `site_contact`.
- Persisted audit of who viewed whom.
- A dedicated PWA preview.
- Rewriting every loader that still uses `auth.uid()` before first ship. Record misses; fix as they show empty.

## Error handling

| Case | Behaviour |
|------|-----------|
| Invalid or tampered cookie | Clear cookie. Redirect `/{locale}/dashboard/admin?viewAs=ended`. Admin chrome shows a one-shot toast from that query and strips it. |
| Subject deleted or excluded | Same as invalid cookie. |
| Role does not match the portal path | Clear cookie. Redirect `/dashboard/admin`. |
| Non-admin presents the cookie | Ignore cookie. Existing role redirects apply. |
| `startViewAs` on an admin or self | Clear / do not set. Go to own workspace for that role. |
| Search with no hits | Empty state. Stay put. |
| Mutation while view-as | No write. Read-only error. |

## Testing

- `resolveDashboardActor`: valid subject, invalid cookie, non-admin, role mismatch, self, admin subject, `site_contact`.
- `assertNotViewAs` blocks a representative portal action and allows the same action with no cookie.
- Selector: Admin and Teacher with no person clear view-as; Student opens search filtered to students; Staff filters assistants; All does not filter role.
- Student layout: admin + student cookie enters; admin without cookie redirects.
- One e2e smoke: admin picks a seeded student, sees student home + banner, a write CTA is disabled, Volver a admin leaves the student portal.

Existing `AdminChromeHeaderSwitch` tests that expect a single teacher-portal link update to the new control.

## Files (expected)

- `src/components/dashboard/StaffWorkspaceSwitch.tsx` — becomes the role selector + person search (or a sibling component it renders).
- `src/components/dashboard/AdminChromeHeader.tsx`, `TeacherChromeHeader.tsx`, `PortalShell.tsx`, `AssistantDashboardShell.tsx` — mount selector when admin or view-as; banner when view-as.
- `src/app/[locale]/dashboard/{teacher,student,parent,assistant}/layout.tsx` — actor + allow rules.
- `src/lib/dashboard/resolveDashboardActor.ts` (new), view-as cookie helpers, `startViewAs` / `clearViewAs` / people search action.
- Portal server actions: `assertNotViewAs`.
- Dictionaries `en` / `es` / `pt` for banner, search empty, read-only error.
- Tests listed above.

No database migration.
