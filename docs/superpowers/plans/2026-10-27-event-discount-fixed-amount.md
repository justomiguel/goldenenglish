# Event discount fixed amount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A discount code is a percent or a fixed amount off a limited number of tickets, with a separate Excel for each mode.

**Architecture:** One pure price function feeds the total card and the enroll SQL. Preview returns the stored rule. Staff pick the mode on the Codes tab. Each mode imports and exports its own workbook, and export always starts with two example rows that import skips.

**Tech Stack:** Next.js App Router, Supabase migration `222`, Vitest, ExcelJS.

## Global Constraints

- A code is percent or fixed amount, never both.
- Covered tickets = min(seats, ticket count). Extra tickets stay at the unit price.
- Fewer seats than the ticket count covers every seat. The new unit does not go below 0.
- CLP and ARS round half up to a whole unit. Other currencies round to two decimals.
- Family discount and a code still do not stack.
- Submit sends the code text. The server computes the amount.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral Latin American tuteo.
- Migration `222` is additive. Update `masterdb.sql`. Write `docs/adr/2026-10-27-event-discount-fixed-amount.md`.

---

### Task 1: Price rule

- [ ] Test covered, extra, floor at 0, and CLP rounding.
- [ ] Add `applyEventFixedAmountDiscount` and use it in the registration total.

### Task 2: Excel

- [ ] Test example skip, examples-only, wrong file, and an old percent file.
- [ ] Parse and build two workbooks. Export and generator include the two examples.

### Task 3: Admin

- [ ] Mode control shows only the fields for that mode.
- [ ] Save, import, export, and generate pass the mode. The list shows percent or amount × tickets.

### Task 4: Public total and charge

- [ ] Preview returns the rule.
- [ ] The total card lists covered tickets, the amount off, and extra tickets.
- [ ] A fixed-amount code hides payment only when the registration total is 0.
- [ ] Gateway reload uses the redemption snapshot.

### Task 5: Persistence

- [ ] Migration `222` adds nullable amount columns and replaces the enroll wrapper.
- [ ] ADR and product changelog entry.
