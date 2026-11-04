# Trial class E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A family books a free trial on the public form, staff marks the visit, and the admin home week card counts it.

**Architecture:** The isolated seed turns on both public CTAs and one trial section. Playwright uses the existing registration project. Counts are relative to the card text before the booking.

**Tech Stack:** Playwright, `seed-admin.sql`, Next.js isolated stack on port 3100.

## Global Constraints

- Isolated stack only. Do not point the spec at a tenant database.
- Spanish copy stays in dictionaries. The spec matches existing labels.
- Desktop Chrome. Do not add a PWA mark control in this change.
- Fee stays 0. Do not call a payment gateway.

---

### Task 1: Seed

- [x] Set `site_settings.public_cta_mode` to jsonb `"both"`.
- [x] Insert or update section `E2E Trial` with `offers_trial`, `trial_fee_amount` 0, and a 23:00 slot on every weekday.

### Task 2: Spec

- [x] Add `e2e/critical-registration-trial.spec.ts`.
- [x] Book as an anonymous adult, open the trial inbox, mark Presente, then read the home card.
- [x] Assert the card delta only when `scheduled_on` is inside `adminHomeOpsWindow` for `America/Argentina/Cordoba`.

### Task 3: Run

- [x] Reseed and run `--project=chromium-critical-registration e2e/critical-registration-trial.spec.ts`.
