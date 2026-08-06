# Student portal shows its own chrome

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 1 of 8
**Closes:** F03
**Related:** `src/app/[locale]/dashboard/student/layout.tsx`, `ParentDashboardShell`,
`ParentDashboardShellClient`, `ParentPwaShell`, `ParentPwaTabBar`, `ParentSidebar`,
`ParentBreadcrumb`, `dashboard.studentNav`, `dashboard.studentChrome`

## Intent

A student who logs in is told they are in the family area. The header badge reads
"Familia", the landmark is "Panel familiar", the sidebar group is "Área familias", every
breadcrumb starts at "Familia", and the schedule entry is called "Asistencias" — a word
aimed at whoever monitors attendance, not at whoever attends. The student is the account
holder, not the person observing one.

The cause is `src/app/[locale]/dashboard/student/layout.tsx` mounting
`ParentDashboardShell`, which defaults every label to `dashboard.parentNav` and
`dashboard.parentChrome`.

## Context

Two findings shaped the approach and are worth recording, because the obvious fix is wrong.

**`StudentDashboardShell` exists but must not be mounted.** It and its tree —
`StudentSidebar`, `StudentSidebarNavContent`, `StudentBreadcrumb`, `StudentMobileDrawer`,
`buildStudentSidebarNavGroups` — are referenced only by each other and by two test files.
No route mounts them. Adopting it would be a regression on three counts:

1. It renders a side drawer, not the PWA bottom tab bar. Students would lose the installed
   app's primary navigation on phones.
2. It takes no `includePayments`, so minor students would see the payments module that
   `getProfilePermissions` currently hides from them.
3. Its nav omits Progress and Settings, although `/dashboard/student/progress` and
   `/dashboard/student/settings` exist. Both would become unreachable from the menu.

**The shell already supports what is needed.** `ParentDashboardShellClient`,
`ParentPwaShell` and the desktop branch all accept optional `navDict` and `chromeLabels`
overrides. The server wrapper `ParentDashboardShell` simply does not declare or forward
them. And `dashboard.studentChrome` already exists in all three locales, with
"Panel del alumno" and the badge "Alumno".

## Decisions

| Topic | Choice |
|-------|--------|
| Shell | Keep `ParentDashboardShell`; pass student dictionaries as overrides |
| `StudentDashboardShell` tree | Leave untouched. Deleting dead code is spec 8, not this one |
| Shell rename to a neutral name | Out of scope. A rename across many imports should not ride along with a behavior fix |
| Missing `studentNav` keys | Add all 8, making `studentNav` structurally identical to `parentNav` |
| Payments gating | Unchanged. `includePayments` keeps flowing from `getProfilePermissions` |
| Database | No migrations |
| Tour anchors | Unchanged. `PARENT_TOUR_ANCHORS` are `data-tour` attributes only; `ParentHelpLauncher` is mounted by the family layout, not the shell, so students never see the family tutorials |

## Architecture

### Dictionary keys

`dashboard.studentNav` is missing 8 keys that `dashboard.parentNav` has:
`progress`, `settings`, `pwaTabBarAria`, `breadcrumbChild`, `breadcrumbProgress`,
`breadcrumbSettings`, `tipProgress`, `tipSettings`.

They are load-bearing, not cosmetic. `ParentPwaTabBar` reads `progress`, `settings` and
`pwaTabBarAria` for three of its six tabs and its accessible name; `ParentBreadcrumb` reads
`breadcrumbProgress` and `breadcrumbSettings`; `ParentSidebar` reads the two tips. Missing
keys would render `undefined` labels and an unnamed navigation landmark.

Because `Dictionary` is `typeof en`, adding these keys to `en.json` makes
`Dictionary["dashboard"]["studentNav"]` structurally assignable to the
`Dictionary["dashboard"]["parentNav"]` prop type, with no signature changes anywhere.

Copy to add, in the student's own voice (second person in `es`, matching the existing
`tip*` entries):

| Key | es | en | pt |
|-----|----|----|----|
| `progress` | Progreso | Progress | Progresso |
| `settings` | Configuración | Settings | Configurações |
| `pwaTabBarAria` | Navegación de la app | App navigation | Navegação do app |
| `breadcrumbChild` | Alumno | Student | Aluno |
| `breadcrumbProgress` | Progreso | Progress | Progresso |
| `breadcrumbSettings` | Configuración | Settings | Configurações |
| `tipProgress` | Tus tareas, mini-tests, devoluciones y logros en un solo lugar. | Your tasks, mini-tests, feedback, and achievements in one place. | Suas tarefas, mini-testes, feedback e conquistas em um só lugar. |
| `tipSettings` | Idioma y preferencias de la app. | Language and app preferences. | Idioma e preferências do app. |

`breadcrumbChild` maps to the `children` path segment in `ParentBreadcrumb`. Students have
no `/children` route, so it never renders for them; it exists to keep the two dictionaries
structurally identical.

### Prop forwarding

`ParentDashboardShell` gains two optional props, `chromeLabels` and `navDict`, with the
same types the client component already declares, and forwards them unchanged. Defaults
stay untouched, so the family portal behaves exactly as today.

### Student layout

`src/app/[locale]/dashboard/student/layout.tsx` passes
`navDict={dict.dashboard.studentNav}` and `chromeLabels={dict.dashboard.studentChrome}`.
Everything else in that file — the auth guard, the role check, `getProfilePermissions`,
`baseHref` — is unchanged.

### Resulting labels for a student

| Surface | Today | After |
|---------|-------|-------|
| Header badge | Familia | Alumno |
| Header landmark | Panel familiar | Panel del alumno |
| Sidebar group | Área familias | Área del alumno |
| Schedule entry | Asistencias | Mi agenda |
| Breadcrumb root | Familia | Alumno |
| Tab-bar landmark | Navegación de la app familiar | Navegación de la app |
| Home entry | Inicio | Inicio (unchanged) |

Routes, icons, ordering and payments gating are identical before and after. Only the
words change.

## Testing

TDD, self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **Dictionary parity** (extend `src/__tests__/i18n/dictionaries.test.ts`): for `es`, `en`
   and `pt`, every key of `dashboard.parentNav` exists in `dashboard.studentNav` with a
   non-empty string. Structural, so it also guards against future drift.
2. **Tab bar with the student dictionary** (`ParentPwaTabBar`): rendering with
   `studentNav` and `baseHref` `/es/dashboard/student` produces six tabs, no `undefined`
   label, an accessible name of "Navegación de la app", and hrefs under
   `/es/dashboard/student`.
3. **Payments gating survives the override**: same component with `includePayments={false}`
   renders five tabs and no payments entry.
4. **Sidebar with the student dictionary** (`ParentSidebar`): shows "Área del alumno" and
   "Mi agenda", and no longer shows "Área familias" or "Asistencias".

## Done when

1. A logged-in student sees "Alumno" in the header badge and student wording throughout
   the sidebar, breadcrumb and tab bar, in `es`, `en` and `pt`.
2. The family portal renders byte-identically to today; no parent-facing copy changes.
3. Minor students still see no payments entry in sidebar or tab bar.
4. Students keep the PWA bottom tab bar on mobile and the sidebar on desktop.
5. No `undefined` label and no unnamed navigation landmark on any student route.
6. `studentNav` has every key `parentNav` has, in all three locales, enforced by test.
7. No migrations; no changes to `StudentDashboardShell` or its tree.

## Out of scope

- Deleting the dead `StudentDashboardShell` tree — spec 8.
- Renaming `ParentDashboardShell` to a neutral name — spec 8.
- Page titles, headings and breadcrumb consistency — spec 4.
- Whether `/dashboard/student/calendar` should be an agenda or attendance — spec 6.
- Content of the student home screen — spec 7.
- Student tutorials or a help launcher for students. Students have none today and this
  spec does not add one.

## Manual QA (student)

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Log in as a student on desktop: header badge reads "Alumno", sidebar group reads
   "Área del alumno", schedule entry reads "Mi agenda".
2. Same account at 390 px wide: bottom tab bar present with six tabs, labels intact.
3. Open Progress and Settings from the menu: both load, and the breadcrumb reads
   "Alumno › Progreso" and "Alumno › Configuración" instead of starting at "Familia".
4. As a minor student, confirm no payments tab or sidebar entry.
5. Log in as a parent and confirm the family portal is unchanged.
6. Switch to `en` and `pt` and confirm no `undefined` label appears.
