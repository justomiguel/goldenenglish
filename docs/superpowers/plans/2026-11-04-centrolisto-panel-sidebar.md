# CentroListo panel sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After sign-in, open a panel the person can use, with a sidebar to the main CentroListo pages and the tools for that role.

**Architecture:** `resolvePulsarPostLoginPath` sends owners away from the staff fleet home. The auth form uses `window.location.assign`. One pure nav builder feeds a desktop rail and a narrow menu inside `PulsarPanelFrame`. Admin chrome and the signed-in account frame both use that frame.

**Tech Stack:** Next.js App Router, React, Tailwind tokens, Vitest, dictionary JSON (`en`, `es`, `pt`).

## Global Constraints

- Owner plus `next` `/admin` or `/admin/login` goes to `/cuenta`. A theme path under `/admin/tenants/` stays.
- Staff still go to `/admin` or the password screen.
- Public Panel link goes to `/cuenta`.
- Desktop rail. Narrow and PWA use a menu button and the same links.
- Login and register keep the public chrome.
- Copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Leading Lucide icons on buttons and nav rows. Tokens only. Targets at least 44px on the narrow menu.

---

### Task 1: Post-login path

- [ ] Extend `pulsarSessionActions.test.ts` for owner fleet home, owner login next, owner theme path, and staff fleet home.
- [ ] Update `resolvePulsarPostLoginPath`.
- [ ] Run that test file.

### Task 2: Full navigation after sign-in

- [ ] Test that `PulsarAccountAuthForm` assigns `window.location` to the resolved path.
- [ ] Replace `router.push` with `window.location.assign`.
- [ ] Run that test file.

### Task 3: Nav model

- [ ] Test `buildPulsarPanelNav` and `isPulsarPanelItemActive` for staff, owner, and market query.
- [ ] Add `src/lib/pulsar/pulsarPanelNav.ts`.
- [ ] Add `panelNav` strings in the three dictionaries.
- [ ] Run that test file.

### Task 4: Shell

- [ ] Render the rail for staff and the menu for a narrow surface.
- [ ] Point Panel links in `PulsarSiteChrome` and `PulsarSiteChromePwa` at `/cuenta`.
- [ ] Wrap `PulsarAdminChrome` and signed-in `PulsarAccountFrame` in `PulsarPanelFrame`.
- [ ] Update the PWA chrome test.
- [ ] Run the new shell test and the PWA chrome test.

### Task 5: Changelog

- [ ] Prepend a `site` entry dated `2026-11-04` in `catalogEntriesNow.ts`.
