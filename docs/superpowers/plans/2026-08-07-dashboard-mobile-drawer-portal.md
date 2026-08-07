# Dashboard Mobile Drawer Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin/teacher/assistant (and unused student) mobile hamburger drawers paint a full-viewport nav when opened, by portaling the overlay to `document.body`.

**Architecture:** Extract shared open-state + Escape/body-lock/md-close into `useDashboardMobileDrawer`, and a `DashboardMobileDrawerPortal` that `createPortal`s backdrop + dialog to `document.body`. Each role drawer keeps its own chrome/nav content; only the overlay mount point changes. Parent/student narrow shells stay on `ParentPwaShell` untouched.

**Tech Stack:** React 19 client components, `react-dom` `createPortal`, Vitest + Testing Library, Tailwind.

**Spec:** [`docs/superpowers/specs/2026-08-07-dashboard-mobile-drawer-portal-design.md`](../specs/2026-08-07-dashboard-mobile-drawer-portal-design.md)

## Global Constraints

- Do not change `ParentPwaShell`, `ParentDashboardShellClient`, or student/parent layout surface gating.
- Do not mount `StudentDashboardShell` on live routes.
- Do not redesign admin tables/forms or build `AdminPwaShell`.
- Hamburger trigger stays in the header; only open overlay portals.
- z-index of portaled overlay must beat chrome header `z-50` (use `z-[100]` / `z-[101]`).
- Run focused tests with `npx vitest run <path>`. Full precommit runs on `git commit`.

## File map

| File | Role |
|------|------|
| `src/hooks/useDashboardMobileDrawer.ts` | open/close + Escape + body lock + md close |
| `src/components/dashboard/DashboardMobileDrawerPortal.tsx` | portal backdrop + dialog shell |
| `src/__tests__/hooks/useDashboardMobileDrawer.test.ts` | hook behavior |
| `src/__tests__/dashboard/AdminMobileDrawer.test.tsx` | portal + existing md-close |
| `Admin/Teacher/Assistant/StudentMobileDrawer.tsx` | consume hook + portal |

---

### Task 1: Hook + portal + AdminMobileDrawer

**Files:**
- Create: `src/hooks/useDashboardMobileDrawer.ts`
- Create: `src/components/dashboard/DashboardMobileDrawerPortal.tsx`
- Create: `src/__tests__/hooks/useDashboardMobileDrawer.test.ts`
- Modify: `src/components/dashboard/AdminMobileDrawer.tsx`
- Modify: `src/__tests__/dashboard/AdminMobileDrawer.test.tsx`

**Interfaces:**
- Produces:
  - `useDashboardMobileDrawer(): { open: boolean; openDrawer: () => void; close: () => void }`
  - `DashboardMobileDrawerPortal({ open, onClose, dialogLabel, children })`

- [x] **Step 1: Write failing hook + AdminMobileDrawer portal tests**

- [x] **Step 2: Implement hook + portal; wire AdminMobileDrawer**

- [x] **Step 3: Run `npx vitest run src/__tests__/hooks/useDashboardMobileDrawer.test.ts src/__tests__/dashboard/AdminMobileDrawer.test.tsx` — expect PASS**

- [x] **Step 4: Commit** `fix(dashboard): portal mobile nav drawer out of blurred header`

---

### Task 2: Teacher, Assistant, Student drawers

**Files:**
- Modify: `src/components/dashboard/TeacherMobileDrawer.tsx`
- Modify: `src/components/dashboard/AssistantMobileDrawer.tsx`
- Modify: `src/components/dashboard/StudentMobileDrawer.tsx`

- [x] **Step 1: Replace duplicated open/effects/overlay with hook + portal in all three**

- [x] **Step 2: Re-run Admin + hook tests (regression)**

- [x] **Step 3: Commit** `fix(dashboard): portal teacher, assistant, student mobile drawers`

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| Portal overlay to body | 1–2 |
| Shared Escape / body lock / md close | 1 |
| All four drawers | 1–2 |
| Parent/student PWA untouched | constraint (no file edits) |
| Admin SurfaceMountGate narrow unchanged | constraint |
| Tests for portal + md-close | 1 |
