# ADR 2026-05 — Student messages to administration

## Context

Portal messaging originally limited student outbound mail to assigned teachers only (`portal_messages_insert_student`). Product needs students to reach administration directly.

## Decision

1. **RLS** — Allow student `INSERT` when `recipient_id` references a profile with role `teacher` or `admin` (replacing teacher-only recipient check).
2. **Delivery** — Server action inserts **one row per admin** with shared `broadcast_batch_id` so each admin gets their own inbox row and badges/notifications stay correct.
3. **Student UI** — Collapses outbound broadcast copies into one timeline entry labelled “Administration”; delete removes every row in the batch until staff reply.

## Consequences

- Migration adds nullable `broadcast_batch_id` on `public.portal_messages`.
- Email: each notified admin receives `notifyPortalRecipientForStaffMessage` (existing template).
