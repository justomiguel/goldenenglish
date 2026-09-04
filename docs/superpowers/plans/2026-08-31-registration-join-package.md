# Registration Join Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. User asked to implement in this session (inline).

**Goal:** Reserve `/matricula` and Unirse charge one frozen join package (matrícula + first owed month) and only then enrol the family; staff can still accept by hand.

**Architecture:** Pure helpers for remaining classes, join month, and package snapshot. Submit/assign write that snapshot. Capture seeds `current` on the **frozen** tuition months. Inbox and mail copy name the next action.

**Tech Stack:** TypeScript, Vitest, existing `registrations.fee_snapshot` JSONB, `applyJoinBillingDisposition`.

## Global Constraints

- 250-line file ceiling (`03-architecture.mdc`)
- en + es copy; `pt.json` same keys (`09-i18n-copy.mdc`)
- No new table / intake_state enum / RLS
- No seat hold; no two-step pay
- TDD: failing test before production code

## File map

| File | Role |
|------|------|
| `src/lib/register/sectionHasRemainingClassThisMonth.ts` | Remaining class this month |
| `src/lib/register/pickJoinPackageMonth.ts` | This month vs next vs none |
| `src/lib/register/planJoinPackageQuote.ts` | Enrollment + tuition + credit → snapshot |
| `src/lib/register/parseJoinPackageSnapshot.ts` | Legacy + join_package |
| `src/lib/register/formatJoinPackageCopy.ts` | Inbox / mail / CTA lines |
| `src/lib/register/buildRegistrationEnrollmentFeeInsertFields.ts` | Write package; no section → `needs_section` |
| `src/lib/billing/applyJoinBillingDisposition.ts` | Optional per-section join months |
| `src/lib/register/finalizeAcceptedRegistrationLead.ts` | Paid capture uses snapshot months |
| `src/lib/register/loadTrialConvertQuoteFacts.ts` | Same month helper |
| Inbox + dictionaries + `/matricula` labels | Next-action copy |

---

### Task 1: Remaining class + join month (pure)

Tests then helpers. See spec § Package.

### Task 2: Planner + snapshot parse

`planJoinPackageQuote` + `parseJoinPackageSnapshot`. Empty sections → total 0.

### Task 3: Submit / assign insert fields

No section IDs → `needs_section`, total 0. With section → package total (matrícula + month).

### Task 4: Seed snapshot months + Unirse

`joinMonths` on seeder when `paidCapture`. Trial facts pick month via remaining-class rule.

### Task 5: Copy

Inbox, mail CTA, `/matricula` title/breakdown. en/es/pt keys.
