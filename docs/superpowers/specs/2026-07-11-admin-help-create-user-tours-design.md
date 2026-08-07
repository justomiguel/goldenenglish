# Admin help — create user tours (student / teacher / admin)

**Date:** 2026-07-11  
**Status:** Approved  
**Related:** [`2026-07-11-admin-help-tutorials-design.md`](./2026-07-11-admin-help-tutorials-design.md), ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md`, `.cursor/rules/31-admin-tutorials-copy.mdc`

## Intent

Add **three** Help FAB task tutorials that teach how to create users from `/{locale}/dashboard/admin/users/new`:

1. **Create a student** — including how **birth date** switches the form between **minor + tutor/guardian** and **adult without tutor**.
2. **Create a teacher**
3. **Create an admin**

Tours **guide only**: they never submit the form and never create Auth/profile rows.

## Understanding

- Create UI: `AdminCreateUserForm` + `useAdminCreateUserForm` on `/dashboard/admin/users/new`.
- Role select includes student / teacher / admin (and others); these tours cover the three requested roles only.
- For **student**: birth date required; if age &lt; `legalAgeMajority`, guardian panel appears (`existing` | `new` tutor); adult students show email; minors use synthetic email hint + DNI + guardian.
- Entry: Users subnav **Add** (`AdminSectionSubnav` → `…/users/new`); sidebar Users link already exists for nav.
- Existing pattern: Driver.js + `data-tour` + catalog + `startAdminTutorial` switch (cohort/section tours).

## Goals

1. Three catalog rows with distinct titles/descriptions/icons.
2. Shared navigation: close Help → ensure create-user page → wait for form anchors.
3. Student tour teaches the **age → tutor** rule with an **in-tour branch** (minor vs adult), same branch-button rules as create-cohort (no Driver `driver-popover-next-btn` on custom actions).
4. Teacher and admin tours select the matching role and walk personal + credentials fields.
5. Final step on **Submit** explains that the user fills remaining data and submits **after** the tour ends.
6. Dictionaries `en` / `es` / `pt`; Vitest for catalog, step builders, runners (mocked Driver); analytics entities per tutorial id.

## Non-goals

- Creating real users / invites during the tour.
- Separate catalog rows for “student with tutor” vs “without” (one student tour + branch).
- Tours for parent / assistant roles.
- Explain-this-screen tour for the users list or create page (follow-up).
- CSV import tour.
- Changing create-user business rules.

## Product rules (locked)

| Rule | Detail |
|------|--------|
| Catalog shape | **B:** three tutorials — `create-student`, `create-teacher`, `create-admin`. |
| Persistence | **Guide only** — no `createDashboardUser` call from the tour; do not auto-click Submit. |
| Student variants | One tour; **birth-date branch** after explaining the field: minor path (wait for guardian panel) vs adult path (email field, no guardian). |
| Guardian modes | On minor path, explain **both** existing guardian search and create-new tutor (one or two steps); do not require completing either. |
| Engine | Same Driver.js runner / tokens / tour session as other task tours. |
| Copy | Teach why (age majority, who needs a tutor, staff roles); follow `31-admin-tutorials-copy.mdc`. |

## UX

### Shared preamble (all three)

1. Close help panel.
2. If not on `…/users/new`, `router.push` there; wait for `data-tour="admin-create-user-form"` (bounded timeout → `logClientWarn`).
3. Optional: highlight Users sidebar / subnav **Add** when starting from elsewhere (skip if already on create page and anchors present).
4. Intro popover (`anchor: null`) — what this role tour teaches; reminder that **nothing is saved until you submit after the tour**.

### Create student (`create-student`)

Suggested order:

1. Intro — students, majority age, tutor only for minors.
2. Role — set/select **student** (`data-tour="admin-create-user-role"`); explain default may already be student.
3. Name / DNI / phone cluster (or separate short steps) — DNI especially required for minors.
4. Birth date — explain control drives the rest of the form (`legalAgeMajority` from system).
5. **Branch popover** (in-tour, two footer actions):
   - **Ver camino menor (con tutor)** → copy asks staff to pick a birth date that makes age &lt; majority → wait for `admin-create-user-guardian` → steps: guardian mode radios, existing search vs new tutor fields, relationship, synthetic email hint.
   - **Ver camino mayor (sin tutor)** → pick adult birth date → wait for adult email field → highlight email/password; note no tutor panel.
6. Submit button — “when ready, complete fields and create; tour does not save.”
7. Done.

If the user already has a birth date filled when entering the branch, the runner may skip the “pick a date” wait when the matching panel is already visible.

### Create teacher (`create-teacher`) / Create admin (`create-admin`)

1. Intro — staff role purpose (teacher vs admin privileges at a high level; no security deep-dive).
2. Role select — choose `teacher` or `admin`.
3. Personal fields (name, optional birth if shown — birth is student-only today, so skip if hidden).
4. Email + password (+ hint).
5. Submit — guide-only closing message.
6. Done.

Keep these tours shorter than student (~6–8 steps).

### Help list

Three new rows under task tutorials (below Explain this screen). Icons (catalog): e.g. `graduationCap` / `user` for student, `bookOpen` or `chalkboard` for teacher, `shield` for admin — extend `AdminTutorialIconId` + `tutorialCatalogIcons.ts` as needed.

## Architecture

```
src/lib/admin-tutorials/
  catalog.ts                    # + create-student | create-teacher | create-admin
  createUserTourShared.ts       # pure: route helper, shared selectors, guide-only close step
  createStudentTour.ts          # pure steps + branch metadata
  createTeacherTour.ts
  createAdminTour.ts            # or thin wrappers over shared staff builder with role param
  client/
    ensureCreateUserPage.ts     # navigate + waitForSelector
    startCreateStudentTour.ts   # branch wait like create-cohort
    startCreateTeacherTour.ts
    startCreateAdminTour.ts
    startAdminTutorial.ts       # switch cases
```

Prefer a **shared staff step builder** (`buildCreateStaffTourSteps(role: "teacher" | "admin", copy)`) to avoid duplicating teacher/admin.

### Anchors (`data-tour`)

| Anchor | Element |
|--------|---------|
| `admin-create-user-form` | Form root |
| `admin-create-user-role` | Role `<select>` |
| `admin-create-user-first-name` | First name |
| `admin-create-user-last-name` | Last name |
| `admin-create-user-dni` | DNI (when shown) |
| `admin-create-user-phone` | Phone |
| `admin-create-user-birth` | Birth date control wrapper |
| `admin-create-user-email` | Email (adult student / staff) |
| `admin-create-user-password` | Password |
| `admin-create-user-minor-hint` | Synthetic email hint (optional) |
| `admin-create-user-guardian` | Guardian panel root |
| `admin-create-user-guardian-mode` | Existing / new radios |
| `admin-create-user-guardian-search` | Existing guardian combobox |
| `admin-create-user-guardian-new` | New tutor fields block |
| `admin-create-user-relationship` | Relationship select |
| `admin-create-user-submit` | Submit button |
| `admin-users-nav-add` | Users subnav Add link (optional nav step) |
| `admin-nav-users` | Sidebar Users (reuse/add if missing) |

### i18n

```
dashboard.adminHelpCatalog.create-student.*
dashboard.adminHelpCatalog.create-teacher.*
dashboard.adminHelpCatalog.create-admin.*
dashboard.adminHelpTours.createStudent.steps.*
dashboard.adminHelpTours.createStudent.birthDateBranch.*   # minor vs adult buttons + prompts
dashboard.adminHelpTours.createTeacher.steps.*
dashboard.adminHelpTours.createAdmin.steps.*
```

Shared chrome buttons (`doneBtn`, `nextBtn`, …) may reuse keys from an existing tour namespace or a small `createUserShared` block — prefer one shared block to avoid triple duplication.

### Observability

- `trackEvent` with entities `admin_tutorial:create-student` | `create-teacher` | `create-admin` on start / complete / skip.
- Client warn scope e.g. `admin.tutorials.createStudent` on missing anchors / timeout.

### Testing

| Layer | Coverage |
|-------|----------|
| Catalog | three new ids present |
| Step builders | order, selectors, branch ids; staff builder role param |
| Runners | mocked Driver; navigate helper; branch waits; **never** calls submit / create action |
| Anchors | smoke that form exposes `data-tour` |
| RTL list | Help list shows three new Play rows |

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| User submits mid-tour by habit | Copy + final step stress guide-only; do not auto-fill PII that looks “ready to save” |
| Branch waits forever | On branch click, dispatch sample birth date via `ge:admin-tutorial:apply-create-user-demo`; then short `waitForSelector`; timeout → warn + end tour |
| Teacher/admin duplication | Shared staff builder |
| Form default role already student | Role step still explains; teacher/admin tours dispatch role before tour + on highlight |

## Definition of done

- [ ] Spec approved; plan written (multi-file).
- [ ] Three catalog tutorials startable from Help FAB.
- [ ] Student tour branch: minor (guardian) vs adult (email, no guardian).
- [ ] Teacher and admin tours select correct role and walk credentials.
- [ ] No create/invite side effects from tour runners.
- [ ] `data-tour` anchors on create-user form / nav as listed.
- [ ] Dictionaries en/es/pt; Vitest for pure + runner mocks + list smoke.
- [ ] Manual QA (user): run each tour on Nago/dev; confirm no user created when only following the tour.

## Out of scope

- Parent/assistant create tours.
- Registration-accept modal tour.

## Amendment (2026-07-11) — sample birth / role for branch UI

Waiting for guardian/email without setting birth date caused the “with tutor” path to hang. **Decision:** on branch (and for staff before the tour), dispatch `ge:admin-tutorial:apply-create-user-demo` so `useAdminCreateUserForm` sets role + a sample `YYYY-MM-DD` (minor = majority−1 years, adult = majority+5). Guide-only; still never submits.

## Open questions (defaults if you approve without comment)

1. **Nav steps:** highlight sidebar Users + subnav Add when not already on create page → **default: yes, one combined or two short steps**.
2. **Minor guardian depth:** one step for mode + one for “existing vs new fields” → **default: two steps**.
3. **Staff birth date:** not shown for non-students today → **default: omit from teacher/admin tours**.
