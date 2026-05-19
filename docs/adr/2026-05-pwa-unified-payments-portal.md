# ADR: PWA unified payments portal (parent + student)

## Context

Parent and student payment screens on narrow/PWA surfaces showed inconsistent balances (invoices mixed across children, monthly grid without family total) and duplicated finance tabs. Product asked for one PWA screen per role with consolidated debt, per-child breakdown, filtered month grid, and optional advance monthly payments per section.

## Decision

1. **Pure aggregator** `buildFamilyPaymentsSummary` combines per-child `StudentMonthlyPaymentsView` rows and open `billing_invoices`, skipping enrollment lines when an open enrollment-tagged invoice exists.
2. **Parent PWA** uses `ParentPaymentsScreenPwa` (hero + accordion + child picker + strip); desktop keeps `ParentFinanceTabs`.
3. **Student PWA** uses hero + filtered strip (no four-bucket year summary card on narrow).
4. **Remove “next due”** from `BillingPortalScreen`, `StudentPaymentsYearSummary`, and `buildStudentPaymentsYearSummary`.
5. **`academic_sections.allow_advance_monthly_payment`** (default `false`) enforced in `resolveStudentPaymentSlot`, Flow start, and focus UI.

## Consequences

- Server loads monthly view + invoices per linked child on parent payments page.
- Admin configures advance payments on section fees settings (academic section + collections settings tab).
- Tests cover family summary double-count guard and slot rejection for future months when flag is off.
