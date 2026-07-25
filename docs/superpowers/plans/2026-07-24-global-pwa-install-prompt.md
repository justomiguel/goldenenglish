# Global PWA install prompt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Mount one floating `PwaInstallPrompt` from `[locale]/layout` on all locale routes; remove inline parent/student mounts.

**Architecture:** Thin client host wraps existing molecule with fixed bottom-center chrome + tab-bar clearance. Locale layout loads `dict.pwa.install` and skips greenfield setup. Hook behavior unchanged.

**Tech stack:** Next.js App Router, existing `PwaInstallPrompt` / `usePwaInstallPrompt`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-24-global-pwa-install-prompt-design.md`

---

## File map

| File | Role |
|---|---|
| `src/components/molecules/PwaInstallPromptHost.tsx` | Client floating host |
| `src/app/[locale]/layout.tsx` | Mount host + dict |
| `src/components/pwa/organisms/ParentPwaShell.tsx` | Remove inline prompt |
| `src/components/student/StudentDashboardEntry.tsx` | Remove prompt + prop |
| `src/__tests__/molecules/PwaInstallPromptHost.test.tsx` | Host behavior |
| Existing parent/student tests | Drop assumptions about inline prompt if any |

---

### Task 1: Floating host (TDD)

- [x] Write failing test: host renders floating region; shows title after `beforeinstallprompt`
- [x] Implement `PwaInstallPromptHost` with fixed bottom-center + safe-area + narrow clearance
- [x] Green tests

### Task 2: Locale layout wiring

- [x] Load dictionary in `[locale]/layout`; mount host when not greenfield
- [x] Smoke: host receives copy keys (or layout-level test if practical)

### Task 3: Dedup mounts

- [x] Remove from `ParentPwaShell` and `StudentDashboardEntry`
- [x] Update any broken tests
- [x] Run targeted Vitest

---

## Manual QA (user)

- [ ] Android Chrome: banner on login and a dashboard → Install
- [ ] iOS Safari: Share / Add to Home Screen hint
- [ ] Parent PWA: tab bar still tappable; one banner only
- [ ] Dismiss persists across navigation
