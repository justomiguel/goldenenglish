# CentroListo home house Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CentroListo home with six still screens, one load entrance, and two moments.

**Architecture:** `PulsarLandingHome` composes six section components inside the existing chrome. Sunday and Day 5 are client sections that run once via `useOnceInView`. Copy lives in `pulsar.home.house` in en, es, and pt. The narrow chrome hides the extra free-page bar on the home.

**Tech Stack:** Next.js App Router, React, Tailwind, Vitest, dictionary JSON.

## Global Constraints

- Spanish in `es.json` uses neutral tuteo.
- The hero still is `public/centrolisto/clients/espaciozenit.jpg`.
- `{count}` comes from `activeTenantCount`.
- Easing is `cubic-bezier(0.22, 1, 0.36, 1)`.
- `prefers-reduced-motion: reduce` shows the finished state.
- No new analytics events. The free-page links keep `cl_create_free_page`.
- One changelog row in `supabase/pulsar-migrations/`.
- Files stay at or under 250 lines.

---

### Task 1: Home contract

- [x] Rewrite the home assertions in `PulsarLandingPages.test.tsx`.
- [x] Run that file and confirm the new assertions fail.

### Task 2: Copy and sections

- [x] Add `home.title` and `home.house` in en, es, and pt.
- [x] Add the six sections and swap `PulsarLandingHome`.
- [x] Run the home test.

### Task 3: Motion and chrome

- [x] Draw the logo once. Run Sunday and Day 5 once. Remove pointer shift from the home.
- [x] Hide the narrow free-page bar when `activeNav` is `home`.
- [x] Add the changelog migration `028`.

### Task 4: Check

- [x] Run the home test and the narrow chrome test.
