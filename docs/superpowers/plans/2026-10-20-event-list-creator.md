# Event list creator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the staff member who created each event on the admin events list.

**Architecture:** `loadPaginatedAdminEvents` reads `events.created_by` for the current page and loads those profiles. The screen renders the surname-first name. No schema change.

**Tech Stack:** Next.js, Supabase, Vitest, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Name order is surname, then given name.
- The profile lookup uses only creator ids on the current page.
- Column header copy is in `en.json`, `es.json`, and `pt.json`.
- Spanish is neutral Latin American tuteo.
- Do not sort or filter by creator.
- Do not show the creator on the public events list.

---

### Task 1: Loader

- [x] Add a failing test that a row exposes `createdByName` as surname first.
- [x] Select `created_by` and load `profiles` for those ids only.
- [x] Run the loader test.

### Task 2: List column

- [x] Add a failing screen test for the Creator column.
- [x] Add the column, dictionary keys, and page label.
- [x] Add the product changelog entry.
- [x] Run the screen test and the loader test.
