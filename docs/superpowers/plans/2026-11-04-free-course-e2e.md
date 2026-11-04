# Free course E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An adult student enrolls in a free course and sees the title on progress.

**Architecture:** The isolated seed publishes one free course. Playwright uses the student storage from auth setup. No payment gateway.

**Tech Stack:** Playwright, `seed-admin.sql`, Next.js isolated stack on port 3100.

## Global Constraints

- Isolated stack only.
- Desktop Chrome. Do not change the PWA progress tree.
- Price stays 0. Do not call Flow or Mercado Pago.

---

### Task 1: Seed and project

- [x] Upsert `e2e-free-course` in `seed-admin.sql`.
- [x] Add Playwright project `chromium-critical-course`.

### Task 2: Spec

- [x] Student opens the course, clicks enroll, and sees the title under `?tab=courses`.
- [x] Run that project on the isolated stack.
