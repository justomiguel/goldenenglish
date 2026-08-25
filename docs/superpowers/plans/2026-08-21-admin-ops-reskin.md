# Admin operations reskin Implementation Plan

> **For agentic workers:** Implement inline in this session (user asked to proceed). Steps use checkbox (`- [ ]`) syntax. **Do not commit** — repo policy: spec + plan + implementation land together when the user asks.

**Goal:** Reskin the admin workplace to a dark daily rail, an Instituto hub, locked Alumnos/Profesores lists, and a greeting Home, with tours rewritten to the new map.

**Architecture:** Pure builders own the daily list, the Instituto inventory, and active-item resolution. The shell only paints those results. Students and teachers pages reuse `AdminUsersScreen` with a forced role. No migrations. ⌘K stays student search (it is not a destination jumper); discoverability of former sidebar items is the Instituto hub plus the existing Help catalog.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind token colors, Vitest + Testing Library, existing Driver.js admin tours.

**Spec:** [`docs/superpowers/specs/2026-08-21-admin-ops-reskin-design.md`](../specs/2026-08-21-admin-ops-reskin-design.md)

## Global Constraints

- No `git commit` unless the user explicitly asks. Spec and plan stay untracked/uncommitted until then.
- No database migrations. No traffic sparkline. No campus photo. No Padres list.
- Teacher / parent / student portals are not reskinned.
- Copy in `es`, `en`, `pt` in the same task that introduces a key. Visible Home label is the word `Home` in all three. Greeting is `Hola, {name}` / locale equivalents, never gendered “Bienvenida”.
- Existing `data-tour` ids are relocated, not renamed. `admin-nav-users` moves to the Alumnos item.
- Tests are self-contained (`.cursor/rules/30-harness-self-contained-tests.mdc`).
- `siteSetupRequired` still hides the sidebar. `teacherPortalAllowed`, `blog_enabled`, and the email-templates mega-admin flag keep today’s meaning.
- Every pre-change suffix in `ADMIN_CONTENT_ROUTES` still resolves (no 404).

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/dashboard/buildAdminDailyNavItems.ts` | Eight daily items, exact order and hrefs |
| `src/lib/dashboard/buildAdminInstituteHubGroups.ts` | Four hub groups; Blog / email-templates gated |
| `src/lib/dashboard/adminSidebarNavActive.ts` | Instituto children + person-record role highlight |
| `src/lib/dashboard/adminInstituteChildPaths.ts` | Which pathnames are Instituto children |
| `src/components/dashboard/adminSidebarNavGroups.tsx` | Thin wrapper or deleted after callers move |
| `src/components/dashboard/AdminSidebar.tsx` | Dark rail: logo, daily items, profile footer |
| `src/components/dashboard/AdminChromeHeader.tsx` | Switch + utilities + bell; no logo |
| `src/components/dashboard/AdminDashboardShell.tsx` | Sidebar full-height + right column |
| `src/components/dashboard/AdminInstituteHub.tsx` | Hub page rows |
| `src/components/dashboard/AdminHubHome.tsx` | Greeting, cards, Impulsa |
| `src/components/dashboard/AdminInstituteTrail.tsx` | `Instituto → {page}` on children only |
| `src/app/[locale]/dashboard/admin/institute/page.tsx` | Hub route |
| `src/app/[locale]/dashboard/admin/students/page.tsx` | Locked student list |
| `src/app/[locale]/dashboard/admin/teachers/page.tsx` | Locked teacher list |
| `src/app/[locale]/dashboard/admin/layout.tsx` | Load display name, avatar, person-record role |
| `src/dictionaries/{es,en,pt}.json` | Home / Alumnos / Profesores / Instituto / hub / greeting / tours |
| `src/lib/admin-tutorials/*` | New screen ids, Home copy, start paths |

---

### Task 1: Daily nav builder

**Files:**
- Create: `src/lib/dashboard/buildAdminDailyNavItems.ts`
- Modify: `src/components/dashboard/adminSidebarNavGroups.tsx` (delegate to the builder so existing imports keep compiling during the move)
- Test: `src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts`
- Modify: `src/__tests__/components/adminNav.spec5.test.tsx` (canonical daily hrefs, `admin-nav-users` on `/students`)
- Modify: `src/__tests__/components/adminSidebarNavGroups.glossary.test.tsx` (glossary is not in the daily list)
- Modify: `src/__tests__/components/adminSidebarNavGroups.emailTemplates.test.tsx` (templates/blog not in the daily list)

**Interfaces:**
- Consumes: `Dictionary["dashboard"]["adminNav"]`, `AdminSidebarNavBadges`, `financeHref?: string`
- Produces: `buildAdminDailyNavItems(base, dict, badges, options?: { financeHref?: string }): AdminSidebarNavItem[]`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildAdminDailyNavItems } from "@/lib/dashboard/buildAdminDailyNavItems";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/admin";

function hrefs(opts?: Parameters<typeof buildAdminDailyNavItems>[3]) {
  return buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
    newRegistrations: 4,
    recentInboundMessages: 2,
  }, opts).map((i) => i.href);
}

describe("buildAdminDailyNavItems", () => {
  it("returns the eight daily hrefs in spec order", () => {
    expect(hrefs()).toEqual([
      BASE,
      `${BASE}/students`,
      `${BASE}/teachers`,
      `${BASE}/registrations`,
      `${BASE}/academic`,
      `${BASE}/finance`,
      `${BASE}/messages`,
      `${BASE}/institute`,
    ]);
  });

  it("keeps registration and message badges", () => {
    const items = buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
      newRegistrations: 4,
      recentInboundMessages: 2,
    });
    expect(items.find((i) => i.href.endsWith("/registrations"))?.badge).toBe(4);
    expect(items.find((i) => i.href.endsWith("/messages"))?.badge).toBe(2);
  });

  it("puts admin-nav-users on Alumnos and admin-nav-academic on Cohortes", () => {
    const items = buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
      newRegistrations: 0,
      recentInboundMessages: 0,
    });
    expect(items.find((i) => i.href.endsWith("/students"))?.tourId).toBe("admin-nav-users");
    expect(items.find((i) => i.href.endsWith("/academic"))?.tourId).toBe("admin-nav-academic");
  });

  it("does not list former sidebar destinations", () => {
    const set = new Set(hrefs());
    expect(set.has(`${BASE}/users`)).toBe(false);
    expect(set.has(`${BASE}/events`)).toBe(false);
    expect(set.has(`${BASE}/glossary`)).toBe(false);
    expect(set.has(`${BASE}/cms/blog`)).toBe(false);
    expect(set.has(`${BASE}/communications/templates`)).toBe(false);
  });

  it("honours financeHref", () => {
    const custom = `${BASE}/finance?tab=collections&cohort=abc`;
    expect(hrefs({ financeHref: custom })).toContain(custom);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL** (module missing)

```bash
npx vitest run src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts
```

- [ ] **Step 3: Implement `buildAdminDailyNavItems`**

Return eight `AdminSidebarNavItem`s. Reuse the `AdminSidebarNavItem` type from `adminSidebarNavGroups.tsx` (move the type into `buildAdminDailyNavItems.ts` if that avoids a cycle). Icons: Home, GraduationCap (students), School (teachers), ClipboardList, CalendarDays, Banknote, MessageCircle, Building2. Home `href` is `base`. Instituto `tourId` is `admin-nav-institute` (new, for the Home tour). Alumnos `tourId` is `admin-nav-users`.

Make `buildAdminSidebarNavGroups` return `[{ label: dict.navScopeInstitution, items: buildAdminDailyNavItems(...) }]` so `AdminSidebarNavContent` still compiles. Email-templates and blog options become unused on this function (hub owns them).

- [ ] **Step 4: Re-run Task 1 tests — expect PASS**

- [ ] **Step 5: Update spec5 / glossary / email-templates tests** so they assert the new daily set. Spec5 “every destination survives” becomes “daily hrefs are the eight; former destinations are absent from the daily builder”. `admin-nav-users` is found on `/students`. Teacher-header tests stay. Do not commit.

---

### Task 2: Instituto hub inventory

**Files:**
- Create: `src/lib/dashboard/buildAdminInstituteHubGroups.ts`
- Test: `src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts`

**Interfaces:**
- Produces:

```ts
export type AdminInstituteHubRow = {
  href: string;
  label: string;
  tip: string;
};

export type AdminInstituteHubGroup = {
  id: "academic" | "growth" | "site" | "dataHelp";
  label: string;
  rows: AdminInstituteHubRow[];
};

export function buildAdminInstituteHubGroups(
  base: string,
  dict: Dictionary["dashboard"]["adminNav"] & { instituteHub: InstituteHubDict },
  options: { includeBlogNav?: boolean; includeEmailTemplatesNav?: boolean },
): AdminInstituteHubGroup[];
```

Dictionary key `dashboard.adminNav.instituteHub` (added in Task 4 if not yet present — Task 2 tests may use a local stub object until Task 4 lands; prefer adding the keys in Task 4 first if you implement in order).

**Exact rows:**

- academic: calendar, events, academic/contents, badges
- growth: coupons, promotions, and `/cms/blog` iff `includeBlogNav`
- site: cms, site-setup, settings, users (Todas las cuentas — new label key `allAccounts`)
- dataHelp: analytics, audit, glossary, and `/communications/templates` iff `includeEmailTemplatesNav`

- [ ] **Step 1: Failing test** asserting group ids, href lists, and flag omissions (blog/templates absent by default, present when flagged).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement the builder**
- [ ] **Step 4: Run — PASS**
- [ ] **Step 5: Do not commit**

---

### Task 3: Active item — Instituto children and person records

**Files:**
- Create: `src/lib/dashboard/adminInstituteChildPaths.ts`
- Modify: `src/lib/dashboard/adminSidebarNavActive.ts`
- Test: `src/__tests__/lib/dashboard/adminSidebarNavActive.test.ts`
- Test: `src/__tests__/lib/dashboard/adminInstituteChildPaths.test.ts`

**Interfaces:**
- `isAdminInstituteChildPath(pathname: string, base: string): boolean` — true for events, calendar, contents, badges, coupons, promotions, cms, site-setup, settings, analytics, audit, glossary, communications/templates, users (including `/users/[id]` and `/users/new` and `/users/import`), and their descendants. False for students, teachers, registrations, academic (except `academic/contents`), finance, messages, home, institute itself.
- `isAdminSidebarNavItemActive(pathname, href, base, profileHref, allHrefs, extras?: { personRecordRole?: string | null })`  
  - If pathname is `/users/:uuid` (and not new/import): `student` → students href active; `teacher` → teachers; else Instituto.
  - If `isAdminInstituteChildPath` and href is the institute item → active.
  - Else existing longest-prefix rules among daily hrefs.

- [ ] **Step 1: Extend `adminSidebarNavActive.test.ts`** with cases: `/events` → institute; `/academic/:uuid` → academic not institute; `/users/:uuid` + role student → students; + role parent → institute; `/students` → students.
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run — PASS**
- [ ] **Step 5: Do not commit**

---

### Task 4: Dictionary keys (es / en / pt)

**Files:**
- Modify: `src/dictionaries/es.json`, `en.json`, `pt.json`
- Existing locale-parity tests must stay green.

**Keys (add, do not remove unused old group keys until tours no longer read them):**

- `dashboard.adminNav.home` = `"Home"` in all three
- `dashboard.adminNav.students` = Alumnos / Students / Alunos
- `dashboard.adminNav.teachers` = Profesores / Teachers / Professores
- `dashboard.adminNav.institute` = Instituto / Institute / Instituto
- `dashboard.adminNav.allAccounts` = Todas las cuentas / All accounts / Todas as contas
- `dashboard.adminNav.tipStudents`, `tipTeachers`, `tipInstitute`, `tipAllAccounts`
- `dashboard.adminNav.instituteHub.{academic,growth,site,dataHelp}` group titles
- `admin.home.title` = `"Home"` (tab / metadata; must equal `adminNav.home`)
- `admin.home.greeting` = `"Hola"` / `"Hi"` / `"Olá"`
- `admin.home.greetingNamed` = `"Hola, {{name}}"` / `"Hi, {{name}}"` / `"Olá, {{name}}"`
- `admin.home.boost.title`, `boost.lead`, `boost.event`, `boost.promotion`, `boost.blog`
- `dashboard.adminChrome.workspaceAdmin`, `workspaceTeacher`
- `dashboard.adminChrome.bellAria`, `bellEmpty`, `bellMessages`, `bellRegistrations`
- `dashboard.adminNav.profileMenuAria`

Update spec5 test 4: `adminNav.home === admin.home.title` still holds (both `Home`).

- [ ] **Step 1: Add keys in all three files**
- [ ] **Step 2: Run locale-parity / spec5 label tests**
- [ ] **Step 3: Do not commit**

---

### Task 5: Shell chrome

**Files:**
- Modify: `AdminDashboardShell.tsx`, `AdminSidebar.tsx`, `AdminSidebarNavContent.tsx`, `AdminChromeHeader.tsx`, `AdminMobileDrawer.tsx`, `admin/layout.tsx`
- Create: `src/components/dashboard/AdminAttentionBell.tsx`, `src/components/dashboard/AdminSidebarProfileFooter.tsx`
- Test: `src/__tests__/components/dashboard/AdminChromeHeaderSwitch.test.tsx`
- Modify: spec5 teacher-header tests (one teacher control, still `data-tour="admin-chrome-teacher-portal"`)

**Layout load (admin/layout.tsx):** select `first_name`, `last_name` / surname fields already used by `formatProfileSnakeSurnameFirst`, plus avatar. Parse `/users/:uuid` from the path (headers/`params` + a child segment is not in layout — use a helper that reads the current path from `headers().get("x-pathname")` only if the app already does that; otherwise pass `personRecordRole` from a small server wrapper on the users `[userId]` layout, or fetch in `AdminDashboardShell` via a new optional prop set by a nested `users/[userId]/layout.tsx`). Preferred: `src/app/[locale]/dashboard/admin/users/[userId]/layout.tsx` already exists or add one that sets nothing visual but we instead fetch role in `admin/layout` by reading `headers()` — **do not invent a pathname header**. Add `src/app/[locale]/dashboard/admin/users/[userId]/layout.tsx` that is a pass-through, and pass role through React `cache()` from the page… simpler: **`loadAdminPersonRecordRole(pathname)` called from `AdminSidebarNavContent` is wrong (client).** Server: in `admin/layout.tsx`, `const path =` we don't have the rest of the path.

**Correct approach:** `createAdminClient` + parse nothing in root admin layout. Add optional prop `personRecordRole` on the shell. A new client-safe pattern: `AdminSidebarNavContent` accepts `personRecordRole` from shell. Nested `users/[userId]/layout.tsx` cannot easily lift props to the parent shell.

**Use `useSelectedLayoutSegment` / `useParams` in the client nav:** if `params.userId` is a UUID, the users layout is a client provider… still need the role.

**Simplest spec-faithful approach:** server component `AdminSidebar` stays server? Today nav content is client because of `usePathname`. Add a parallel fetch: pass `personRecordRole` from `admin/layout` by importing `connection()` and… Next.js `admin/layout` receives only `{locale}`.

Implement a tiny RSC `AdminPersonRecordRoleGate` inside `users/[userId]/layout.tsx` that writes `data-person-role` on a wrapper, and the client nav reads `document` — fragile.

**Chosen:** `users/[userId]/page.tsx` already loads the profile. Extract `loadAdminUserRole(userId)` and call it from a new **client context** populated by a server child… too heavy.

**Chosen (lock this):** add `src/app/[locale]/dashboard/admin/users/[userId]/layout.tsx` as an async server layout that loads the role and renders `<AdminPersonRoleProvider role={role}>{children}</AdminPersonRoleProvider>` (client context). `AdminSidebarNavContent` reads the context. Tests for the provider are optional; Task 3 unit-tests the pure function; the sidebar passes `personRecordRole` from context into `isAdminSidebarNavItemActive`.

Shell paint:
- Outer: `flex min-h-screen`. Sidebar `hidden md:flex w-64 flex-col bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]` (or primary if secondary is not dark enough — use `color-mix` against `--color-secondary` so tenants stay on-brand).
- Logo + brand name at top of sidebar (`data-tour` chrome header stays on the right header).
- Daily items: no group headings. Active = slightly lighter fill + white text.
- Footer: `AdminSidebarProfileFooter` with kebab (Mi perfil, LanguageSwitcher, SignOutButton). `data-tour="admin-sidebar-profile"`.
- Header: no logo. Segmented ADMIN / ÁREA DOCENTE when `teacherPortalAllowed` (single control, desktop + mobile; `data-tour="admin-chrome-teacher-portal"` on the teacher side). Tagline. Site. Bell. Sign out. Locale.
- Content: `flex-1 bg-[var(--color-muted)]` — remove the inner bordered white card.
- Mobile drawer: same daily items, dark panel.

Bell: two rows linking to messages and registrations; badge = sum of counts; no badge if both zero; empty copy when both zero.

- [ ] **Step 1: Header switch tests** (one teacher link when allowed; zero when not; `data-tour` present; no second “Panel docente” button).
- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement shell**
- [ ] **Step 4: Run chrome + spec5 teacher tests — PASS**
- [ ] **Step 5: Do not commit**

---

### Task 6: Instituto page + trail

**Files:**
- Create: `src/app/[locale]/dashboard/admin/institute/page.tsx`
- Create: `src/components/dashboard/AdminInstituteHub.tsx`
- Create: `src/components/dashboard/AdminInstituteTrail.tsx`
- Modify: `AdminDashboardShell.tsx` — replace `AdminBreadcrumb` with `AdminInstituteTrail`
- Test: `src/__tests__/components/dashboard/AdminInstituteHub.test.tsx`

Hub renders groups from `buildAdminInstituteHubGroups`. Each row is a link with label, tip, chevron. `data-tour="admin-institute-hub"`.

Trail: if `isAdminInstituteChildPath` (or current path is not daily and not `/institute`), show `Instituto → {resolved label}`. Daily pages and `/institute` show nothing.

- [ ] **Step 1: Hub test** — four headings; no Blog row by default; Blog when `includeBlogNav`.
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement page + trail**
- [ ] **Step 4: PASS**
- [ ] **Step 5: Do not commit**

---

### Task 7: Alumnos and Profesores lists

**Files:**
- Create: `src/app/[locale]/dashboard/admin/students/page.tsx` (and a small layout with list + add + import)
- Create: `src/app/[locale]/dashboard/admin/teachers/page.tsx` (list + add, no import)
- Modify: `src/app/[locale]/dashboard/admin/users/page.tsx` — unchanged unfiltered list
- Modify: `src/app/[locale]/dashboard/admin/users/new` create form to honour `?role=`
- Modify: students/teachers layouts’ add hrefs: `/users/new?role=student` and `?role=teacher`
- Test: `src/__tests__/lib/dashboard/adminLockedRoleUsersParams.test.ts` — a 5-line helper `lockedRoleParams(role, searchParams)` that forces `role` and drops a conflicting query `role`

Reuse `loadPaginatedAdminUsers` and `AdminUsersScreen`. Hide or disable the role filter when `lockedRole` is set (`AdminUsersToolbar` already has `roleFilter` — pass a `lockRole` prop).

- [ ] **Step 1: Helper test** — `lockedRoleParams("student", { role: "teacher", q: "a" })` yields `{ role: "student", q: "a" }`
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Helper + pages + `lockRole` on toolbar**
- [ ] **Step 4: PASS + create-form default role from query**
- [ ] **Step 5: Do not commit**

---

### Task 8: Home

**Files:**
- Modify: `AdminHubHome.tsx`, `admin/page.tsx`
- Test: `src/__tests__/components/dashboard/AdminHubHomeOrder.test.tsx` and `smoke-part1` AdminHubHome cases
- Test: `src/__tests__/components/dashboard/AdminHubHomeReskin.test.tsx`

Greeting: `greetingNamed` with display name, else `greeting`. Banner href `/students`. Users card href `/students`; title can stay the accounts copy (update `viewAll` to Alumnos). No sparkline in the tree. Impulsa strip: events (`/events/new` if that route exists, else `/events`), `/promotions`, `/cms/blog` if `includeBlog`. `data-tour="admin-hub-boost"`.

Pass `greetingName` and `includeBlog` from the home page (layout already has blog flag — thread it, or read `loadBlogEnabled` again on the home page).

- [ ] **Step 1: Reskin test** — greeting text, banner href contains `/students`, users card href `/students`, no `[data-sparkline]`, boost links present
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: PASS** (including order test: payments still before birthdays)
- [ ] **Step 5: Do not commit**

---

### Task 9: Tours and catalog

**Files:**
- Modify: `explainAdminHomeTour.ts` — add optional steps: institute (`admin-nav-institute`), boost, bell (`admin-chrome-bell`), profile footer
- Modify: `adminTourAnchors.ts` — `navInstitute`, `hubBoost`, `chromeBell`, `sidebarProfile`, `instituteHub`
- Modify: `screenCatalogTypes.ts`, `screenCatalogRoutes.ts` — `admin-students`, `admin-teachers`, `admin-institute` (suffixes `/students`, `/teachers`, `/institute`)
- Modify: `CONTENT_ONLY_SCREEN_TOUR_DEFS` / explain builders for the three new screens (clone users-tour shape for students/teachers; hub groups for institute)
- Modify: create-student / create-teacher / create-admin tour start copy in `es.json` `en.json` `pt.json` — Alumnos / Profesores / Todas las cuentas
- Modify: Home explain copy — no “Usuarios” as a sidebar destination; no “configuración y más” grab-bag
- Modify: hub-child explain intros — one sentence “se llega por Instituto”
- Modify: `listTourRuntimeChecks` / `adminScreenPath` tests
- Test: `src/__tests__/lib/admin-tutorials/explainAdminHomeTour.test.ts` and screenCatalog tests

- [ ] **Step 1: Catalog test** — `adminScreenPath(locale, "admin-students")` is `/…/students`; Home steps include institute; Home ES description does not match `/Usuarios/` as a menu door
- [ ] **Step 2: FAIL**
- [ ] **Step 3: Implement copy + defs**
- [ ] **Step 4: Run `src/__tests__/lib/admin-tutorials/**` — PASS**
- [ ] **Step 5: Do not commit**

---

### Task 10: Callers, Help catalog, leftover tests

**Files:** any remaining `buildAdminSidebarNavGroups` callers (`AdminSidebarNavContent`, finance href helper, glossary icon tests, `adminNavLucideIcons` if new ids are needed), `AdminHubHomeOrder`, PWA admin smokes if they assume “Resumen” or `/users` as the first people link.

- [ ] **Step 1: `rg buildAdminSidebarNavGroups adminNav.home Resumen` and fix breakages**
- [ ] **Step 2: `npx vitest run src/__tests__/components/adminNav.spec5.test.tsx src/__tests__/lib/dashboard/ src/__tests__/components/dashboard/AdminHubHome src/__tests__/lib/admin-tutorials/`**
- [ ] **Step 3: `npx tsc --noEmit`**
- [ ] **Step 4: Do not commit. Hand back to the user.**

## Spec coverage

| Spec item | Task |
|-----------|------|
| Daily eight items | 1 |
| Instituto hub groups + flags | 2, 6 |
| Active nav by role / Instituto children | 3, 5 |
| Home label + greeting + Impulsa | 4, 8 |
| Dark shell, switch, bell, profile footer | 5 |
| No global breadcrumb; Instituto trail | 6 |
| Alumnos / Profesores / Todas las cuentas | 7 |
| Tours rewritten | 9 |
| Palette = student search unchanged; destinos en hub | 6, 10 |
| Locale parity | 4, 10 |
| No sparkline / no photo / no migration | 8, global |

## Execution

User asked to implement now. Execute tasks in order in this session. Do not commit.
