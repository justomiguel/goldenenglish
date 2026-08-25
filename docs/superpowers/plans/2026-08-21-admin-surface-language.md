# Admin surface language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline; user asked to follow minis one by one while traveling). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every admin destination speak the same visual language as Home and the drawer: large primary titles, shared Lucide icons, Instituto as a tile hub.

**Architecture:** One icon map (`adminSurfaceIcon`) and one header (`AdminPageHeader`). The drawer stores `iconId`s. Later minis only replace page titles. No route, loader, or IA changes.

**Tech Stack:** Next.js App Router, React, TypeScript, Lucide, Tailwind tokens, Vitest + Testing Library.

**Spec:** [`docs/superpowers/specs/2026-08-21-admin-surface-language-design.md`](../specs/2026-08-21-admin-surface-language-design.md)

## Global Constraints

- No `git commit` unless the user explicitly asks.
- No migrations, new routes, or new RPCs.
- `--color-secondary` is never an admin page `h1`.
- Existing `data-tour` ids relocate onto `AdminPageHeader`; do not rename them.
- Home, Impulsa, and metric cards are the reference — do not restyle them.
- Teacher / parent / student **content** is out of scope.
- Tests are self-contained (`.cursor/rules/30-harness-self-contained-tests.mdc`).
- Copy in `es` / `en` / `pt` stays; no new product nouns.
- Finish mini N before starting mini N+1.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/dashboard/adminSurfaceIcon.tsx` | Lucide map for every `AdminSurfaceIconId` |
| `src/components/dashboard/AdminPageHeader.tsx` | Title + lead + icon tile + actions |
| `src/components/dashboard/AdminSurfaceCard.tsx` | Optional white body card |
| `src/lib/dashboard/buildAdminDailyNavItems.tsx` | Daily items expose `iconId` |
| `src/components/dashboard/AdminSidebarNavContent.tsx` | Renders shared icons at `h-6`, active tile |
| `src/lib/dashboard/buildAdminInstituteHubGroups.ts` | Rows expose `iconId` |
| `src/components/dashboard/AdminInstituteHub.tsx` | Tile grid + `AdminPageHeader` |
| Admin `page.tsx` / list shells | Swap old `h1` for `AdminPageHeader` |

---

### Task 00: Kit

**Files:**
- Create: `src/lib/dashboard/adminSurfaceIcon.tsx`
- Create: `src/components/dashboard/AdminPageHeader.tsx`
- Create: `src/components/dashboard/AdminSurfaceCard.tsx`
- Test: `src/__tests__/lib/dashboard/adminSurfaceIcon.test.tsx`
- Test: `src/__tests__/components/dashboard/AdminPageHeader.test.tsx`

**Interfaces:**
- Produces: `AdminSurfaceIconId`, `adminSurfaceIcon(id, className?)`, `AdminPageHeader`, `AdminSurfaceCard`

- [ ] **Step 1: Write the failing tests**

`src/__tests__/lib/dashboard/adminSurfaceIcon.test.tsx` asserts every umbrella id returns a node and `"not-an-icon"` returns `null`.

`src/__tests__/components/dashboard/AdminPageHeader.test.tsx` asserts the title is primary, not secondary; lead, actions and `data-tour` render.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/dashboard/adminSurfaceIcon.test.tsx src/__tests__/components/dashboard/AdminPageHeader.test.tsx`

- [ ] **Step 3: Implement the three primitives** exactly as the umbrella header markup and icon table.

- [ ] **Step 4: Re-run tests — pass**

- [ ] **Step 5: Commit** — skip until the user asks.

---

### Task 01: Drawer

**Files:**
- Modify: `src/lib/dashboard/buildAdminDailyNavItems.tsx` — `iconId` instead of `icon: ReactNode`
- Modify: `src/components/dashboard/AdminSidebarNavContent.tsx`
- Modify: `src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts` — assert `iconId`s

**Interfaces:**
- Consumes: `adminSurfaceIcon`
- Produces: `AdminSidebarNavItem.iconId: AdminSurfaceIconId`

- [ ] **Step 1: Extend the daily-nav test** so the eight items have `home`, `students`, `teachers`, `registrations`, `academic`, `finance`, `messages`, `institute`.

- [ ] **Step 2: Run — fail on missing `iconId`**

- [ ] **Step 3: Switch the builder to `iconId`. Render in `AdminSidebarNavContent` with `h-6 w-6` and an active `h-9 w-9` tile on dark tone.**

- [ ] **Step 4: Run `buildAdminDailyNavItems` tests and `StaffChromeThemeTokens` — pass**

- [ ] **Step 5: Commit** — skip.

---

### Task 02: Instituto hub

**Files:**
- Modify: `src/lib/dashboard/buildAdminInstituteHubGroups.ts` — add `iconId` per row
- Modify: `src/components/dashboard/AdminInstituteHub.tsx`
- Modify: `src/app/[locale]/dashboard/admin/institute/page.tsx`
- Modify: `src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts`
- Modify: `src/__tests__/components/dashboard/AdminInstituteHub.test.tsx`

- [ ] **Step 1: Assert academic rows carry `calendar`, `events`, `contents`, `badges`.**

- [ ] **Step 2: Run — fail**

- [ ] **Step 3: Tile grid + `AdminPageHeader` `iconId="institute"`. Keep four groups and gating.**

- [ ] **Step 4: Run hub tests — pass**

- [ ] **Step 5: Commit** — skip.

---

### Task 03: People and registrations

**Files:** the six routes in [`admin-surface/03-people-and-registrations.md`](../specs/admin-surface/03-people-and-registrations.md)

- [ ] Replace each page `h1` with `AdminPageHeader`. Move `data-tour` onto the header. Keep `AdminUsersScreen` / `AdminRegistrationsScreen` bodies.

- [ ] Grep those files for `--color-secondary` on `h1` — none.

- [ ] Run any existing students/teachers/registrations layout tests.

- [ ] Commit — skip.

---

### Task 04: Academic

**Files:** [`admin-surface/04-academic.md`](../specs/admin-surface/04-academic.md)

- [ ] `/admin/academic` header → `AdminPageHeader` with toolbar in `actions`.
- [ ] Contents list header → `iconId="contents"`.
- [ ] Do not restyle the section workspace.
- [ ] Commit — skip.

---

### Task 05: Finance

**Files:** [`admin-surface/05-finance.md`](../specs/admin-surface/05-finance.md)

- [ ] Replace the finance hub bordered chip-header with `AdminPageHeader` `iconId="finance"`. Keep tabs and panels.
- [ ] Receipts list/detail titles onto the kit.
- [ ] Commit — skip.

---

### Task 06: Messages

**Files:** [`admin-surface/06-messages.md`](../specs/admin-surface/06-messages.md)

- [ ] Inbox header → `AdminPageHeader`; compose/thread titles primary via the same component.
- [ ] Commit — skip.

---

### Task 07: Instituto children

**Files:** [`admin-surface/07-institute-children.md`](../specs/admin-surface/07-institute-children.md)

- [ ] Each list/hub page listed in the mini uses `AdminPageHeader` with the mapped `iconId`. Prefer swapping the `h1` inside the existing client shell when that shell owns the title.
- [ ] Commit — skip.

---

### Task 08: Detail and leftover editors

**Files:** [`admin-surface/08-detail-and-editors.md`](../specs/admin-surface/08-detail-and-editors.md)

- [ ] Sweep remaining admin page `h1` + `--color-secondary`.
- [ ] Do not restyle HTML inside a message body.
- [ ] Final grep in the admin tree is empty for title-secondary.
- [ ] Commit — skip.

## Self-review

1. **Spec coverage:** Mini 00–08 each have a task. Icon map, header markup, Instituto tiles, drawer size, no-secondary-titles are all tasked.
2. **Placeholders:** None. Later minis point at the locked header markup in the umbrella rather than inventing a second API.
3. **Types:** `iconId: AdminSurfaceIconId` is the only name later tasks use.
