# Section shell hub navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin academic section `gridTwoRow` tab strip with a hub of area cards + drill-down chrome (Back + compact switcher), keeping `?tab=` and feature-flag visibility.

**Architecture:** Pure helpers decide hub vs area and which cards are visible. A client shell organism owns URL sync (`router.replace`) and mounts either the hub (health + cards) or the selected area panel. Existing panel bodies stay in `AcademicSectionPageShellBody`. Tours retarget hub/drill-down anchors.

**Tech Stack:** Next.js App Router, React client components, Vitest + Testing Library, Lucide, dictionaries en/es/pt.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-23-section-shell-hub-navigation-design.md`
- File ≤250 LOC; one main export per file (`03`)
- Copy only via dictionaries (`09`); buttons with leading Lucide icons (`16`)
- No native `alert`/`confirm` (`18`)
- Tours L1/L2 updated same PR (`33`)
- Self-contained tests (`30`); TDD vertical slices (`02`)
- Admin Tier B — no mandatory PWA pair (`05`)

## File map

| File | Role |
|------|------|
| `src/lib/academics/visibleAcademicSectionShellTabs.ts` | Hub area list (no `general`); resolve tab → hub/area |
| `src/lib/academics/academicSectionShellTabOrder.ts` | Keep ids for URL; document `general` → hub |
| `src/components/organisms/AcademicSectionShellHub.tsx` | Hub: area cards |
| `src/components/molecules/AcademicSectionShellAreaChrome.tsx` | Back + title + compact `<select>` switcher |
| `src/components/organisms/AcademicSectionShellWorkspace.tsx` | Client: hub vs drill-down; URL sync |
| `src/components/organisms/AcademicSectionPageShellBody.tsx` | Wire workspace + panels |
| `src/app/.../[sectionId]/page.tsx` | Pass searchParams → `initialShellArea` |
| Dictionaries | Back, hub aria, switcher aria + tour steps |
| Tours | Anchors + screen tour steps |
| Tests | Helpers + workspace RTL |

---

## Task 1: Pure visibility / resolve helpers

- [x] Extend tests: no `general` in hub list; `tab=general` / missing / flag-off → hub sentinel
- [x] Implement helper API (`visibleAcademicSectionHubAreas`, `resolveAcademicSectionShellArea` → `null` for hub)
- [x] Keep `?tab=` id union including `general` for compat parsing

## Task 2: Hub + chrome + workspace UI (TDD)

- [x] RTL: hub renders cards for visible areas only; click navigates
- [x] RTL: drill-down shows Back + switcher; Back clears tab; switcher changes area
- [x] Build `AcademicSectionShellHub`, `AcademicSectionShellAreaChrome`, `AcademicSectionShellWorkspace`
- [x] Wire panels from `AcademicSectionPageShellBody`; sync `?tab=` via `router.replace`

## Task 3: i18n + page wiring

- [x] Add en/es/pt keys (Back, hub list aria, switcher aria)
- [x] Page passes `initialShellArea` from searchParam resolve

## Task 4: Tours + cleanup

- [x] Update screen tour steps for hub; drop per-tab strip steps
- [x] Remove `AcademicSectionShellTabs` / `gridTwoRow` on section shell
- [x] Workspace Vitest green
- [x] Targeted Vitest run

## Manual QA (user)

- [ ] Flags both off / both on: hub card counts
- [ ] Deep link `?tab=fees`, Back, switcher
- [ ] `?tab=evaluations` with flag off → hub
