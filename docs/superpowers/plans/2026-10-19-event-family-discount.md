# Event family discount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A registration checkbox claims a 10% family discount, and the amount charged is 90% of the registration total.

**Architecture:** A pure helper rounds the discounted total. The enroll action stores `family_discount_claimed` on the attendee. Gateway and transfer checkout read that flag and apply the same helper, so the client never sends an amount.

**Tech Stack:** Next.js App Router, Vitest, Supabase migration, dictionaries en/es/pt.

## Global Constraints

- 10% is fixed. Zero stays zero. CLP and ARS round to a whole unit (half up). Other currencies round to two decimals.
- The checkbox starts unchecked and is hidden when the total is not greater than zero.
- Staff see a badge. There is no approval step and no way to reverse the discount in this change.
- Spanish copy is neutral Latin American tuteo.

### Task 1: Discount helper

- [x] Test `applyEventFamilyDiscount`, then implement it in `src/lib/events/applyEventFamilyDiscount.ts`.

### Task 2: Charge the discounted total

- [x] Persist `family_discount_claimed` (migration 214 and `masterdb.sql`).
- [x] Enroll stores the flag and returns the discounted total.
- [x] `loadEventAttendeeGatewayContext` charges 90% when the flag is set.

### Task 3: Form and admin badge

- [x] Checkbox and live discounted amount on the register form and preview.
- [x] Admin attendee row badge.
- [x] Dictionary keys and changelog entry.
