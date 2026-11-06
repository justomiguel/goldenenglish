# Register section assignment mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff pick one of three public-register section modes in Inscripciones.

**Architecture:** One `site_settings` string, `register_section_mode`, with a fallback to the old boolean. The shared register form reads that mode. A section enrollment link ignores it.

**Tech Stack:** Next.js App Router, Vitest, Supabase `site_settings`, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Modes are `student_choice`, `first_open`, and `admin_assign`.
- Missing or unknown mode follows `register_show_all_sections`: true is `student_choice`, otherwise `first_open`.
- Do not delete the old key. New saves write only the new key.
- `/i/…` still locks its section.
- Trial flows and the staff create-lead form stay unchanged in behavior (staff create still shows the list).
- Spanish copy uses neutral tuteo.
- Next migration after `264_event_seat_holds.sql`. Append it to `masterdb.sql`.

---

### Task 1: Pure mode and picker

- [ ] Add `parseRegisterSectionMode` and picker tests for the three modes plus the enrollment-link short circuit.
- [ ] Implement the parser and switch `resolveRegisterSectionPickerView` to the mode.

### Task 2: Persistence

- [ ] Migration `265_register_section_mode.sql` seeds the key from the old boolean and adds it to `site_settings_select_public`.
- [ ] `getRegisterSectionMode` reads the new key, then the boolean.
- [ ] `setRegisterSectionMode` rejects unknown values and upserts a valid mode.

### Task 3: Screens

- [ ] Replace the Inscripciones checkbox with three radios.
- [ ] Pass `sectionMode` through the public register shells.
- [ ] Staff create-lead keeps `student_choice`.
- [ ] Form test: `admin_assign` posts the undecided value. Enrollment-link test still posts the locked section.

### Task 4: Copy and changelog

- [ ] Keys in `en.json`, `es.json`, and `pt.json`. Remove the old checkbox strings.
- [ ] Prepend a registrations changelog entry dated 2026-11-06.
