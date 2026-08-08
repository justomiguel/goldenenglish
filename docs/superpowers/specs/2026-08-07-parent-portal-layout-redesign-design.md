# Parent portal: layout and information architecture redesign

**Date:** 2026-08-07
**Status:** Approved (brainstorm)
**Kind:** Design spec with phased delivery; each phase gets its own plan under `docs/superpowers/plans/`

**Supersedes, for the family portal only:**

- [`2026-08-07-parent-portal-student-section-focus-design.md`](2026-08-07-parent-portal-student-section-focus-design.md) — focus stays in the URL, but the always-visible switcher (sidebar block on desktop, sticky bar on PWA) is removed. Focus UI renders only when there is something to choose.
- [`2026-08-07-parent-progress-section-picker-design.md`](2026-08-07-parent-progress-section-picker-design.md) and [`2026-08-07-parent-progress-exams-section-design.md`](2026-08-07-parent-progress-exams-section-design.md) — the Progress hub and its picker disappear. Their content becomes sections of the child screen.
- [`2026-08-06-home-screen-priority-design.md`](2026-08-06-home-screen-priority-design.md) — the family half. The four-pillar status grid is replaced by an action feed. The admin and teacher homes that spec also covers are untouched.

**Related:**

- [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — closes the program's open item "the two family pickers still look different" by deleting both, and the parent half of F20 by deleting `ParentBreadcrumb`. The program index needs updating when this lands.
- [`2026-08-06-student-portal-own-chrome-design.md`](2026-08-06-student-portal-own-chrome-design.md) — that spec kept the shared shell and overrode dictionaries. This spec formalises the sharing through a config object instead of parallel dictionaries.
- [`2026-07-12-parent-portal-guided-tours-design.md`](2026-07-12-parent-portal-guided-tours-design.md) — the tour anchor contract, which this redesign breaks and must repair in the same phases.

## Intent

A parent opens the portal to answer two questions: **"is there anything that needs me?"** and **"how is my child doing?"** The current layout answers neither directly. It offers six bottom tabs of equal visual weight, splits the second question across two of them (Asistencias and Progreso), hides five kinds of academic content behind a picker inside one of those, and spends a whole tab on changing the interface language.

This redesign reorganises the family portal around those two questions, on mobile and desktop, and formalises the shell it shares with the student portal.

## Context

### What a parent sees today

On any viewport under 768 px — installed app or browser — `ParentPwaShell` renders a header with brand, profile link and sign-out, a sticky `ParentFocusSwitcher` on every route except home, and `ParentPwaTabBar` with six destinations. Home shows a greeting, a push-permission banner, the focus switcher a second time, a four-pillar status grid and a news feed. At 768 px and above, `ParentDesktopShell` renders `StudentChromeHeader`, `ParentSidebar` with the focus switcher above three nav groups, and `ParentBreadcrumb`.

### Why it fails

Six frictions, all confirmed in the code:

1. **Six tabs have no hierarchy.** Nothing in `ParentPwaTabBar` distinguishes the destination a parent needs weekly from the one they need once.
2. **One question, two tabs.** Attendance and academic progress both answer "how is my child doing?" but live in separate destinations with separate loaders.
3. **Content hidden behind a control.** Exams, tasks, mini-tests, feedback and badges are reachable only by operating the Progress picker. `/parent/assessments`, `/parent/tasks`, `/parent/feedback` and `/parent/badges` exist solely as redirects into it.
4. **A tab for one setting.** `/parent/settings` renders a language switcher and nothing else.
5. **The focus switcher appears twice.** `ParentHomePwaFocus` renders it inline, and `ParentPwaShell` renders it sticky everywhere else — two placements of the same control, for a choice most families never have to make.
6. **The home reports states instead of asking for actions.** "Al día" and "Atención" force the reader to translate a status into a next step, and the two things that should be one tap away — paying an overdue fee, replying to a teacher — are two.

### The load-bearing assumption

The common case is **one child in one section**. Multi-child and multi-section are real but exceptional. Every decision below treats the single case as the default and progressively discloses the rest.

## Decisions

| Topic | Choice |
|-------|--------|
| Mobile destinations | Four: Hoy, Mi hijo, Pagos, Mensajes |
| Desktop navigation | Top bar with the same four destinations. `ParentSidebar` and `ParentBreadcrumb` are deleted |
| Settings | Not a destination. An account sheet opened from the header avatar |
| Sign out | Moves into the account sheet; the standalone header button is removed |
| Attendance and progress | Merged into one child screen with scrollable sections |
| Exams and mini-tests | Merged into a single "Notas" section, distinguished by a label |
| Progress picker | Deleted. Every section is visible in the scroll, each with its own route behind "ver todo" |
| Home content | Action feed built by one pure function, ordered by fixed priority, capped at three actions |
| Failed data source | Surfaced as a neutral card with retry — never silently omitted |
| Push and install prompts | Become low-priority feed items. The floating `PwaInstallPromptHost` is suppressed inside the portal |
| Focus state | Stays in the URL (`?studentId`, `?sectionId`). Unchanged mechanism |
| Focus UI | Rendered only when the parent has more than one child, or the child has more than one active section |
| Shell sharing with students | One `PortalShell` driven by a `PortalShellConfig`; parent and student each supply one |
| Payments gating | Unchanged. `includePayments` and revoked financial access remove the destination, leaving three |
| Pull to refresh | Unchanged. Installed app only |
| Database | No migrations |

## Architecture

### Routes

| Route | Screen | Note |
|-------|--------|------|
| `/[locale]/dashboard/parent` | Hoy | Action feed |
| `/[locale]/dashboard/parent/child` | Mi hijo | Resolves the active child from `?studentId` or the only link |
| `.../parent/child/attendance` | Attendance history | Was the attendance half of `/parent/calendar` |
| `.../parent/child/grades` | Grades — cohort assessments and mini-tests | Was `/parent/progress?tab=exams` plus mini-tests |
| `.../parent/child/tasks` | Tasks | Was `?tab=tasks` |
| `.../parent/child/feedback` | Teacher feedback | Was `?tab=feedback` |
| `.../parent/child/badges` | Achievements | Was `?tab=badges` |
| `.../parent/child/edit` | Child details and class reminders | Was `/parent/children/[studentId]` |
| `.../parent/calendar` | Agenda — upcoming classes, holidays, ICS | Kept, entered from the "next class" card |
| `.../parent/payments` | Payments | Unchanged, including the gateway return routes |
| `.../parent/messages` | Messages | Unchanged |
| `.../parent/account` | Account | Real route, so the sheet is addressable and works on desktop |
| `.../parent/tasks/[taskInstanceId]` | Task detail | Unchanged |

**Calendar keeps its route on purpose.** It holds two different things today: upcoming agenda (with the ICS feed token) and attendance history. Only the history moves. Splitting them is what lets the child screen own "how is my child doing?" without swallowing the agenda.

Redirects to add, all permanent server redirects preserving `studentId` and `sectionId`:

| From | To |
|------|-----|
| `/parent/progress` | `/parent/child` |
| `/parent/progress?tab=exams` (and `assessments`) | `/parent/child/grades` |
| `/parent/progress?tab=tasks` | `/parent/child/tasks` |
| `/parent/progress?tab=feedback` | `/parent/child/feedback` |
| `/parent/progress?tab=badges` | `/parent/child/badges` |
| `/parent/assessments`, `/parent/tasks`, `/parent/feedback`, `/parent/badges` | their `/parent/child/*` equivalent |
| `/parent/settings` | `/parent/account` |
| `/parent/children/[studentId]` | `/parent/child/edit?studentId=<id>` |
| `/parent/billing` | `/parent/payments?tab=fees` (unchanged) |

### Shell

`ParentDashboardShell`, `ParentDashboardShellClient`, `ParentPwaShell` and `ParentDesktopShell` are replaced by a `PortalShell` that knows nothing about children:

```ts
interface PortalDestination {
  id: string;
  href: string;
  label: string;
  icon: PortalIconName;
  badgeCount?: number;
}

interface PortalAccountItem {
  id: string;
  label: string;
  meta?: string;
  href?: string;
  action?: "signOut" | "installApp";
}

interface PortalSubjectConfig {
  /** Rendered only when options.length > 1. */
  options: { id: string; label: string }[];
  activeId: string;
}

interface PortalShellConfig {
  baseHref: string;
  brandBadge: string;
  destinations: PortalDestination[];
  accountItems: PortalAccountItem[];
  subject?: PortalSubjectConfig;
}
```

Two builders produce it: `buildParentShellConfig()` and `buildStudentShellConfig()`, both server-side, both taking the dictionary, permissions and — for parents — the focus catalog already loaded by `parent/layout.tsx`. Surface selection keeps using `useAppSurface`; `PortalShell` renders `PortalTabBar` on narrow and `PortalTopNav` on desktop from the same `destinations` array, so the two surfaces cannot drift.

The student config supplies its own labels — "Hoy", "Mi curso", "Pagos", "Mensajes" — and no `subject`. Its destinations point at the student routes that exist today (`/student`, `/student/progress`, `/student/payments`, `/student/messages`); giving the student portal a route tree that mirrors `/parent/child/*` is a separate piece of work and is out of scope here. Sharing the shell does not require sharing the addresses.

### Account sheet

`PortalAccountSheet` renders `accountItems`: profile, child details, language, notifications, install the app, sign out. On narrow surfaces it is a bottom sheet; on desktop, a dropdown from the avatar. `/parent/account` renders the same list as a page for deep links and for users who land on it directly.

`LanguageSwitcherPwaList` moves here unchanged. The install item is present only when the app is installable and not already installed, reusing `usePwaInstallPrompt`.

### The Today feed

One pure function replaces the six-loader assembly currently inlined in the parent home page:

```ts
type TodayItemKind =
  | "payment_overdue" | "payment_due_soon"
  | "unread_message"
  | "task_due"
  | "absence_unexcused"
  | "new_grade" | "new_feedback"
  | "announcement"
  | "enable_push" | "install_app";

interface TodayItem {
  id: string;
  kind: TodayItemKind;
  severity: "action" | "news";
  tone: "danger" | "warning" | "info" | "success" | "neutral";
  title: string;
  meta: string;
  href: string;
  cta?: string;
  occurredAt: string;
  studentId: string | null;
}

type TodaySource = "payments" | "messages" | "attendance" | "tasks" | "grades" | "news" | "calendar";

function buildParentTodayFeed(input: ParentTodayInput): {
  actions: TodayItem[];
  news: TodayItem[];
  nextClass: ParentNextClass | null;
  degraded: TodaySource[];
};
```

`ParentTodayInput` is the already-shaped output of the existing loaders — `loadParentHomePaymentOverdueSignals`, `loadParentHomeMessageSignals`, `loadParentRecentAttendance`, `loadStudentLearningTasks`, `loadParentHomeNewsFeed`, `loadPortalCalendarPageData` — so the builder performs no I/O and is unit-testable without Supabase.

**Ordering is by kind, not recency**, because urgency does not correlate with timestamp:

1. `payment_overdue`
2. `unread_message`
3. `task_due` — due within 48 hours
4. `absence_unexcused`
5. `payment_due_soon` — due within 7 days
6. `enable_push`, `install_app` — at most one of the two, never above a real action

Ties break by `occurredAt` descending. At most three actions render; when there are more, a "ver todo" control expands the remainder in place — there is no separate actions route, because an action list with its own address would be a seventh destination by another name. News covers the last seven days, five items maximum.

**Degradation is visible.** The page loads its sources with `Promise.allSettled` and passes the failures to the builder as `degraded`. The absence of an alert reads as "everything is fine", so a silently dropped source lies to the parent. Each degraded source renders one neutral card naming what could not be checked, with a retry. The rest of the screen renders normally. This follows the pattern already used by `progressFailureTracker` and `ProgressSectionLoadFailed`.

**The empty state is a real answer.** With no actions, the screen states that everything is up to date and shows the next class. This is the most frequent state and must not look like a screen that failed to load.

### The child screen

Header with the child's name, section, teacher and weekly schedule, then a three-metric strip — attendance percentage, grade average, pending tasks — each linking to its section. Then five sections in scroll order:

| Section | Preview | "Ver todo" |
|---------|---------|------------|
| Asistencia | Last seven class marks and the monthly percentage | `/parent/child/attendance` |
| Notas | Two most recent results, labelled assessment or mini-test | `/parent/child/grades` |
| Comentarios del docente | Most recent entry | `/parent/child/feedback` |
| Tareas | Next due item | `/parent/child/tasks` |
| Logros | Badge row | `/parent/child/badges` |

Sections load and fail independently: a failed section renders its own retry and the other four stay usable. Unread marking keeps `useProgressSectionsUnread` and `progressSeenStorage`, rendered as a dot beside the section title instead of on a picker option.

### Desktop

`PortalTopNav` replaces the sidebar: brand, the four destinations as an underlined tab row, avatar on the right. Content is two columns with a shared maximum width.

| Screen | Left column | Right column |
|--------|-------------|--------------|
| Hoy | Greeting, action cards, next class | News |
| Mi hijo | Child summary, metrics, links to agenda and child details | The five sections |

Detail routes render single-column with a page heading and a back link. With a two-level hierarchy there is nothing for a breadcrumb to disambiguate, which is why `ParentBreadcrumb` goes rather than being fixed.

`SurfaceMountGate` keeps its role: shared route, separate desktop and narrow trees where interaction differs, per `.cursor/rules/01-design-system.mdc` Tier A.

### Focus, when there is a choice

Mechanism unchanged: `?studentId` and `?sectionId` in the URL, resolved by `resolveParentFocus`, propagated by `withParentFocusHref`. What changes is the UI.

| Situation | UI |
|-----------|-----|
| One child, one section | Nothing rendered. The names appear as text in the child screen header |
| Two or more children | A chip row above the content on Hoy and Mi hijo. The destination label becomes "Mis hijos" |
| Two or more active sections | A chip row under the child header, inside Mi hijo only |

`ParentFocusSwitcher`, `ParentFocusSwitcherDesktop`, `ParentFocusSwitcherPwa` and `ParentWardPicker` are all deleted and replaced by one `PortalSubjectChips`.

### Tour anchors

The redesign invalidates ten entries in `PARENT_TOUR_ANCHORS`: `sidebar`, `homeChildSwitcher`, `homeStatusPillars`, `homeInbox`, `progressTitle`, `progressBody`, `settingsTitle`, `settingsBody`, `assessmentsTitle`, `assessmentsBody`. One more, `chromeSignOut`, survives but relocates from the header to an account-sheet item, so its runtime check has to move surfaces with it. Per `.cursor/rules/36-parent-tutorials-contract.mdc`, the tours and their L1/L2 checks are updated **in the same phase** that changes each surface, not afterwards. New anchors cover the account sheet, the action feed and the child screen sections. Note that `ParentHelpLauncher` still returns `null` for parents, so no tour is user-visible today; the contract tests are the thing that must stay green.

### What is reused unchanged

The thirty-odd loaders under `src/lib/parent/`, `ParentPaymentsScreenPwa`, `ParentMessagesPwaClient`, `ParentFeedbackPwaList`, `StudentExamResultsPwaList`, `ParentAttendancePwaScreen`, `ParentTaskDetailScreen`, `BillingPortalScreen`, the calendar board and the ICS feed. This is an information-architecture and shell change, not a rewrite of the domain layer.

### What is deleted

`ParentPwaTabBar` with `resolveParentPwaTab`, `ParentSidebar`, `ParentSidebarNavContent`, `parentSidebarNavGroups`, `ParentBreadcrumb`, the three `ParentFocusSwitcher*` components, `ParentWardPicker`, `ParentHomeStatusGrid`, `buildParentHomePillarSnapshot`, `buildParentHomeChildPillarRows`, `ParentHomeInbox`, `ParentHomePwaFocus`, `ParentProgressEntry` with `buildProgressPickerOptions`, the `/parent/settings` page, and the legacy `ParentDashboardFamilyView`.

## Copy (i18n)

`es`, `en` and `pt`, all in the same change.

- **New:** `dashboard.portal.nav.*` (four destination labels per portal), `dashboard.portal.account.*`, `dashboard.parent.today.*` (one title and detail template per `TodayItemKind`, the all-clear state, the degraded-source line, "ver todo"), `dashboard.parent.child.*` (section titles, metric labels, per-section empty states).
- **Removed:** `dashboard.parentNav.settings`, the `breadcrumb*` keys, `dashboard.parent.focus.*`, and the pillar copy under `dashboard.parent.homeInbox`.
- **Parity:** `dashboard.studentNav` keeps structural parity with the parent nav, still enforced by `src/__tests__/i18n/dictionaries.test.ts`.

Per `.cursor/rules/09-i18n-copy.mdc`, the action titles are written as statements of fact ("Cuota de julio vencida"), and the CTA carries the verb ("Pagar ahora").

## Testing

TDD throughout, self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

**Unit (Vitest)**

1. `buildParentTodayFeed` — kind ordering across a mixed input; recency tiebreak; three-action cap; all-clear state; `degraded` populated when a source is absent; push and install never outrank a real action; multi-child items carry `studentId`.
2. Active-child resolution — valid `studentId`, absent, belonging to another tutor, single-link default.
3. `resolveActiveDestination(pathname, config)` — every route in the table above maps to the right destination, including detail routes and the legacy paths after redirect.
4. `buildParentShellConfig` and `buildStudentShellConfig` — four destinations, three when payments are gated, `subject` present only above one child.

**Component (RTL)**

5. `PortalTabBar` — labels, `aria-current`, no `undefined`, hrefs preserve `studentId` and `sectionId`.
6. Today screen — a degraded payments source renders the neutral retry card and not a false all-clear.
7. Child screen — one failed section renders its retry while the other four render content.
8. Account sheet — language, install and sign out present; install absent when already installed.

**E2E (Playwright, isolated stack)**

9. Overdue fee: Hoy → pay → gateway return → the action is gone.
10. Hoy → Mi hijo → Notas → "ver todo" lands on `/parent/child/grades` with focus preserved.
11. Two children: switching chips changes the content on both Hoy and Mi hijo.
12. Redirect regression: every legacy path in the table lands on its replacement with query parameters intact.

## Delivery phases

Each phase is independently shippable and gets its own plan file.

| # | Phase | Contents |
|---|-------|----------|
| 1 | Shell | `PortalShell`, `PortalTabBar`, `PortalTopNav`, `PortalAccountSheet`, `buildParentShellConfig`. Five destinations pointing at today's routes — Inicio, Asistencias, Progreso, Pagos, Mensajes — because settings and sign out are what move into the sheet in this phase. No route changes |
| 2 | Routes | New route tree, redirects, deletion of the Progress hub and the settings page. The destination list drops to four here, once `/parent/child` exists to absorb Asistencias and Progreso |
| 3 | Hoy | `buildParentTodayFeed`, the Today screen, degraded cards, push and install as feed items |
| 4 | Mi hijo | Child screen with its five sections and the five detail routes; attendance split from the agenda |
| 5 | Desktop | Top nav, two-column layouts, deletion of sidebar and breadcrumb |
| 6 | Student portal | `buildStudentShellConfig` and student labels on the new shell, pointing at the student routes that exist today |

Tour anchors, dictionaries and tests move with the phase that touches their surface.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| A parent's bookmark or an email link points at a removed route | Every legacy path redirects, with parameters preserved, and phase 2 ships a regression test per path |
| The child screen becomes a long scroll nobody reaches the bottom of | Fixed section order by consultation frequency; each section previews two or three items; the metric strip jumps to any section in one tap |
| Removing the sticky focus switcher confuses genuinely multi-child families | Chips appear on both Hoy and Mi hijo whenever there is more than one child; the child's name is always visible in the header |
| Six phases drift and leave the portal half-migrated | Phase 1 changes chrome only and phase 2 changes addresses only; either can sit in production indefinitely without the later phases |
| Tour contract tests break mid-migration | Rule 36 requires updating tours in the same change; phases are scoped by surface so each one owns a bounded set of anchors |
| Three locales fall out of sync | Existing dictionary parity test extended to the new key groups |
| The student portal regresses while its shell changes underneath it | Phase 6 is last; until then students keep the parent config's structure with their own labels, as `2026-08-06-student-portal-own-chrome-design.md` established |

## Out of scope

- The teacher, assistant and admin portals, and their shells and drawers.
- Realigning the student route tree with the new parent one. Phase 6 shares the shell, not the addresses.
- Motion, transitions, skeleton behaviour and perceived-performance work. Real, and the reason the current portal "feels like a website", but orthogonal to information architecture and large enough for its own spec.
- Payment gateway flows, receipt upload and promo codes beyond relocating their entry points.
- The message composer and its recipient resolution.
- Any Supabase schema, RLS or data change.
- Re-enabling `ParentHelpLauncher` or adding new tours. Anchors are kept correct; no tour becomes user-visible.
- Push notification delivery and the service worker.

## Done when

1. A parent on a phone sees four destinations — Hoy, Mi hijo, Pagos, Mensajes — or three when payments are gated, and no settings tab.
2. The header shows brand and avatar only; the account sheet holds profile, child details, language, notifications, install and sign out.
3. Hoy opens with actions ordered by the fixed priority, at most three, and shows the next class; with nothing pending it says so.
4. A failing data source produces a named retry card, never a silent all-clear.
5. Mi hijo answers "how is my child doing?" in one tap, with all five sections visible in the scroll and no picker anywhere.
6. Every legacy route redirects with `studentId` and `sectionId` intact, proven by test.
7. Desktop runs the same four destinations from a top bar; `ParentSidebar` and `ParentBreadcrumb` no longer exist.
8. A family with one child in one section sees no switcher; a family with two sees chips on Hoy and Mi hijo.
9. The student portal renders the same shell from its own config, with student wording and its payments gating unchanged.
10. `es`, `en` and `pt` complete, parity enforced by test; parent tour contract tests green; no migrations.

## Manual QA (user-owned)

Per `.cursor/rules/32-manual-qa-user-owned.mdc`, run per phase against the seeded local stack, at 390×844 and 1440×900, on at least two tenants.

1. Parent with one child and one overdue fee: Hoy shows the payment first; paying it removes the card on return.
2. Same parent with everything settled: Hoy shows the all-clear and the next class, not an empty screen.
3. Mi hijo: all five sections present, each "ver todo" lands on its own URL, the browser back button returns to the child screen.
4. Parent with two children: chips on Hoy and Mi hijo, content changes with the selection, the selection survives navigation.
5. Installed app: pull to refresh still works; the floating install banner no longer covers the tab bar.
6. Minor student's parent with payments gated: three destinations, no payments entry anywhere.
7. Old links: paste `/parent/progress?tab=feedback&studentId=<id>` and confirm it lands on the feedback route with the child preserved.
8. Log in as a student and confirm the portal reads in the student's voice with its own destination labels.
