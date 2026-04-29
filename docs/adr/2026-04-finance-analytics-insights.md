# ADR: Finance Analytics Insights Tab

**Status:** Accepted  
**Date:** 2026-04-28

## Context

After the Finance Hub IA refactor (Plan 1), admins have operational tools (Overview, Collections, Inbox) but lack analytical views to identify trends, measure operational efficiency, and project year-end outcomes. The data needed for these insights largely exists in the system but is not surfaced in a digestible format.

## Decision

Add a 4th **"Insights"** tab to the Finance Hub with three sub-views (Trends, Operations, Projections). Most analytics are **derived from existing data** already loaded in the page (`CohortCollectionsMatrix`), minimizing new infrastructure.

### Data strategy

- **Monthly collection trend, section comparison, year-end projection, and health alerts** are computed by pure functions from the existing `CohortCollectionsMatrixSection[]` data. No additional DB queries.
- **Receipt processing stats** (avg time to resolve, approval rate, rejection breakdown, pending aging) require a **new SQL RPC** (`admin_finance_receipt_processing_stats`) because timing data (`payments.updated_at`, `billing_receipts.resolved_at`) is not included in the bulk collections RPC.

### Schema change

- Added `resolved_at TIMESTAMPTZ` to `billing_receipts` — set when a receipt is approved or rejected. Existing `updated_at` proxy via trigger was insufficient because `billing_receipts` had no `updated_at` column at all. The existing approve/reject RPCs (`admin_approve_billing_receipt`, `admin_reject_billing_receipt`) now set `resolved_at = now()`.

## Options considered

1. **New aggregate RPCs for all analytics** — Rejected. The bulk RPC already loads per-student, per-month cell data; duplicating aggregation in SQL adds maintenance without performance benefit for the single-cohort, single-year scope.
2. **Derive processing time from `system_config_audit` events** — Rejected. Joining on string `resource_id` + `action` patterns is fragile and slower than a dedicated `resolved_at` column.
3. **Client-side only (no migration)** — Partially adopted. Only receipt processing stats needed server-side data; everything else is pure client/server derivation.

## Consequences

- **Positive:** Admins get actionable trend charts, operational metrics, and projections without page reload or new data loads.
- **Positive:** Pure derivation functions are fully testable without DB mocks.
- **Risk:** `payments.updated_at` is used as a proxy for "resolved time" for monthly payments. If `updated_at` is triggered by non-status changes (e.g., admin notes edit), the avg time metric may be slightly inflated. Acceptable for v1; a dedicated `resolved_at` on `payments` can be added if precision becomes important.
- **Follow-up:** If cohort-over-cohort comparison is needed, a dedicated historical aggregation RPC or materialized view would be justified.
