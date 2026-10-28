# Admin mobile hamburger menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The header hamburger and the More tab open a full-screen menu with the person, a local search, and a two-column grid.

**Architecture:** A pure helper filters `buildAdminDailyNavItems` and drops the four bottom-bar destinations. `AdminMobileDrawer` keeps the trigger and the portal. A new screen component renders the grid. The desktop sidebar and `AdminPwaTabBar` stay.

**Tech Stack:** Next.js App Router, React, Vitest, Testing Library, dictionary copy in `en.json` and `es.json`.

## Global Constraints

- Desktop `AdminSidebar` does not change.
- `AdminPwaTabBar` destinations do not change. More still calls `openDrawer()`.
- Drop home, `/students`, `/registrations`, and the finance href from the grid.
- Keep messages, with `recentInboundMessagesCount`.
- Blog and merch appear only when their flags are on.
- Do not add an email-templates tile.
- No second logo. No server search.
- Files stay at or under 250 lines.
- Spanish copy uses neutral tuteo.
- Touch targets are at least 44px. Tokens only. No `hover:opacity`.

---

### Task 1: Filter helper

**Files:**
- Create: `src/lib/dashboard/adminHamburgerMenuItems.ts`
- Test: `src/__tests__/lib/dashboard/adminHamburgerMenuItems.test.ts`

- [x] Write a failing test: drops home, students, registrations, and finance; keeps parents, messages, and institute; blog only with the flag; query is case-insensitive.
- [x] Run `npx vitest run src/__tests__/lib/dashboard/adminHamburgerMenuItems.test.ts` and confirm red.
- [x] Implement `buildAdminHamburgerMenuItems`.
- [x] Re-run the test and confirm green.

### Task 2: Screen

**Files:**
- Create: `src/components/dashboard/AdminHamburgerMenu.tsx`
- Modify: `src/components/dashboard/AdminMobileDrawer.tsx`
- Modify: `src/dictionaries/en.json`, `src/dictionaries/es.json`
- Test: `src/__tests__/dashboard/AdminMobileDrawer.test.tsx`
- Modify: `src/lib/product-changelog/catalogEntriesNow.ts` (move one older row to `catalogEntriesLatest.ts` if Now would pass 250 lines)

- [x] Add dictionary keys `mobileMenuTitle`, `mobileMenuSearch`, `mobileMenuEmpty`.
- [x] Extend the drawer test: person link, no brand name, empty search, tile closes the dialog, messages badge.
- [x] Run the drawer test and confirm the new cases fail.
- [x] Render the screen inside the existing portal. Search state stays in the client component.
- [x] Re-run `npx vitest run src/__tests__/dashboard/AdminMobileDrawer.test.tsx src/__tests__/lib/dashboard/adminHamburgerMenuItems.test.ts`.
