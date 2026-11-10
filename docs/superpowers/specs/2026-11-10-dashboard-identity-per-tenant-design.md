# Phase 10 — Dashboard identity per tenant

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 1 (tokens, fonts), phase 3 (published document), phase 7 (install identity).

## Understanding

- The signed-in areas (admin, teacher, assistant, student, parent) must look like their own institute: logo, colors, fonts, and shape.
- Dashboards are dense work screens. Identity applies through a constrained token set, not through landing variants.
- Student and parent screens are Tier A with web and PWA trees. Admin, teacher, and assistant screens are Tier B.
- Contrast must hold on every tenant palette, including tables, badges, and focus rings.

## Current state (checked 2026-11-10)

1. The root layout inlines `cssRootBlock(properties)`, so dashboards already read `--color-*` from the tenant properties. 370 dashboard component files use `var(--color-…)`.
2. 18 dashboard files still have 39 fixed colors (hex or Tailwind palette classes such as `bg-slate-*`).
3. Bespoke tenants set their look inside landing CSS classes (`.nago-landing`). Their dashboards get the default tokens, not their identity.
4. Shells: `AdminDashboardShell`, `TeacherDashboardShell`, `AssistantDashboardShell`, sidebars, and student and parent PWA screens in `src/components/pwa/organisms/` (`ParentPaymentsScreenPwa`, `ParentMessagesPwaClient`, …).
5. Fonts on dashboards are always DM Sans and Fraunces from the root layout.

## Decision

### 1. App tokens

The published document gets an `app` token group, derived from the site tokens by default:

| Token | Default source | Rule |
|---|---|---|
| `app.surface` | `color.background` | Neutral. If the site background has saturation above 15%, use a neutral derived from it. |
| `app.panel` | `color.surface` | |
| `app.text`, `app.textMuted` | `color.foreground`, `color.muted.foreground` | AA on `app.surface` and `app.panel`. |
| `app.accent`, `app.accentText` | `color.primary`, `color.primary.foreground` | AA pair. |
| `app.sidebar`, `app.sidebarText` | `color.primary` or neutral (`app.sidebarStyle` = `brand` or `neutral`) | AA pair. |
| `app.focus` | `color.primary` | 3:1 on `app.surface` and `app.panel`. |
| `app.radius` | `radius.control` capped at 12 px | |
| `app.density` | `compact` | Fixed set: `compact`, `standard`. |
| `app.font.body` | `font.body` if category is `sans`, else the default sans | Dense UI needs a sans body. |
| `app.font.heading` | `font.heading` | |

- `validateDesignTokens` checks every `app` pair. A failure blocks publish with `contrast_below_aa` and the `app.*` path.
- State colors (`success`, `warning`, `error`, `info`) stay system defaults on dashboards. A tenant cannot make errors unreadable.

### 2. Delivery

- The server builds a dashboard CSS block from `app` tokens and inlines it in the dashboard layout. It emits the current `--color-*` names inside a `.ge-app` scope so existing components need no edits.
- The dashboard layout adds the catalog font classes for `app.font.*`.
- The sidebar and the PWA top bar show the tenant logo (`app.logo.path`), linked to the dashboard home (rule 47).

### 3. Remove fixed colors

- The 18 files with fixed colors move to tokens.
- A unit test scans `src/components/dashboard/**` and `src/components/pwa/**` for hex values and Tailwind palette classes. A new hit fails.

### 4. Editor

- The phase 6 Identity tab gets a "Dashboard" section. It shows the derived `app` tokens, the sidebar style toggle, and a preview of a table, a form, a badge row, and the PWA parent home.
- `app.*` is staff-only by default (`editableBy`).

## Options considered

| Option | Why rejected |
|---|---|
| Reuse site tokens directly | Saturated landing palettes make dense tables unreadable. |
| Dashboard variants like the landing | Dashboards are product screens. Different layouts per tenant would break tours, support, and tests. |
| Allow any font on dashboards | Script and display fonts fail in tables and forms. |
| Keep one product look for all dashboards | The user asked for identity per tenant in dashboards. |

## Surfaces (Web vs PWA)

- **Student and parent (Tier A):**
  - Web: sidebar or header with the logo, `app` tokens, catalog fonts.
  - PWA: `PublicInstalledTopBar` and the bottom tab bar use `app.sidebar` or `app.accent`, safe areas, and 44 px targets. The PWA screens in `src/components/pwa/organisms/` get the same tokens.
  - Tests that must stay green: `tierADashboard*`, `ParentPaymentsScreenPwa`, `ParentMessagesPwaClient`, `ParentAttendancePwaScreen`, `StudentExamResultsPwaList`.
- **Admin, teacher, assistant (Tier B):** desktop shells and sidebars with `app` tokens. No PWA tree is added.

## Plan outline

1. TDD `deriveAppTokens` and the `app` contrast checks.
2. Dashboard CSS block and `.ge-app` scope in the dashboard layout. Font classes.
3. Logo in sidebars and the PWA top bar.
4. Replace the 39 fixed colors. Add the scan test.
5. Dashboard section in the phase 6 editor. Dictionaries. Changelog row (rule 39).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| A palette makes tables hard to read | Neutral surfaces by default, `app` contrast checks, system state colors. |
| Admin tours show other colors | Tours use roles and labels, not colors (rule 33). Recheck tour screenshots. |
| Bespoke tenants change look on dashboards | This is the intended change. Each tenant reviews its preview before publish. |

## Definition of done

- Dashboards of two tenants show their own logo, colors, and fonts (test on the CSS block and the shell).
- No fixed colors in dashboard and PWA component folders (scan test).
- Every `app` pair passes AA, or publish fails with the coded path.
- Tier A PWA tests pass.

## Out of scope

- Layout changes per tenant on dashboards.
- Per-tenant icons for navigation items.

## Manual QA (user)

- As admin, teacher, student, and parent on two tenants: open the home, a table, a form, and the messages screen on desktop and phone. Check readability and identity.
- Install the PWA as a parent and check the top bar and tab bar colors.
