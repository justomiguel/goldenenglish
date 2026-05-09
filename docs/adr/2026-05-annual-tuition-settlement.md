# ADR: Annual tuition settlement (replaces % scholarship for a calendar year)

## Context

Staff negotiate a single annual amount with families. The product must:

- Compare that amount to **list** prices (plan-year monthly fees, ignoring percentage scholarships) plus optional **list enrollment fee**.
- Record **implied discount** (baseline − accepted).
- Mark all billable months in a **calendar year** as paid with amounts that sum to the tuition portion (after reserving the enrollment fee when included).
- **Substitute** percentage scholarships for those months: while an annual settlement row covers a period, `resolveSectionPlanMonthlyAmount` does **not** apply `section_enrollment_scholarships` (rows stay in DB for other years / reporting).

## Decision

Introduce `public.section_enrollment_annual_settlements` with RLS aligned to scholarships. Staff applies settlements from **Admin → student billing** (preview + confirm). Payments are written with explicit allocated amounts and finance audit (`audit_events`) per month plus a batch line. `recordSystemAudit` records the settlement for configuration-style traceability.

## Options considered

- **Deactivate scholarship rows** for the year — rejected to avoid losing configurability and to keep one source of truth for “deal” vs “ongoing % off”.
- **Postgres-only RPC in one transaction** — deferred; current implementation compensates on failure (delete settlement + revert approved months).

## Consequences

- New migration and loader fields on `AdminStudentBillingSectionBenefit`.
- Admin matrix shows **no scholarship %** chip for months covered by a settlement.
- Overlapping settlements per enrollment are rejected in the application layer.

## Follow-ups

- Optional DB **EXCLUDE constraint** or trigger to harden non-overlap.
- Stronger **all-or-nothing** transaction (RPC) if partial apply becomes a operational pain.
