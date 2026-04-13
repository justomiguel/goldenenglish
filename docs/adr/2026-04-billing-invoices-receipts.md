# ADR: Structured billing invoices + manual receipt reconciliation

## Context

The product needs installment-style **billing** with **manual transfer receipts**, admin reconciliation, and a path to **MercadoPago** (`external_reference_id` on invoices). Legacy `public.payments` (monthly rows) remains for existing flows; new work uses `billing_invoices` + `billing_receipts`.

## Decision

- Add `billing_invoices` and `billing_receipts` with enums, RLS, and **SECURITY DEFINER** RPCs `admin_approve_billing_receipt` / `admin_reject_billing_receipt` so approve/reject + invoice status updates are **atomic** and **admin-gated** inside Postgres.
- Store files in the existing **`payment-receipts`** bucket; paths remain **non-public**; signed URLs for review use the **service role** helper. Add a **storage SELECT** policy so admins with a user JWT can also read objects when needed.
- **Teacher “debt” signal** (`loadParentPaymentPendingMap`) also treats **open structured invoices** for **minor** students as pending, so approving an invoice clears the same badge signal as legacy pending payments when applicable.

## Options considered

- **Extend only legacy `payments`**: rejected because the prompt requires invoice/cuota semantics, `verifying`, MercadoPago-ready `external_reference_id`, and cleaner separation from month/year rows.
- **Approve in application code without RPC**: rejected to avoid torn writes between receipt and invoice under concurrency.

## Consequences

- Ops must **create invoices** (admin path / future tool); guardians and adult students use `/parent/billing` and `/student/billing`.
- Requires running migration `025_billing_invoices_and_receipts.sql`.
- Follow-up: automated **overdue** transitions, email/in-app notifications on reject, MercadoPago webhook, and admin UI to **create** invoices.

## Tests

- Vitest: `getFinancialBillingContext` behavior from `profiles.is_minor`.
