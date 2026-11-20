# ADR — FAQ visit and open counts

Date: 2026-11-19
Status: Accepted

## Context

Families read the Mozarthitos questions without a session. `POST /api/analytics/events` stores a row only for a signed-in user. Staff still need a 30-day count of people who see the list, and of which question they open.

## Decision

Store one row in `public.faq_metric_events` per visitor, UTC day, and question. `record_faq_metric` is `SECURITY DEFINER` and ignores a duplicate key. `POST /api/faq/metrics` sets the httpOnly cookie `ge_faq_vid` and sends a hash. The row has no name, email, or IP. `faq_admin_stats_30d` returns counts to an admin session. The admin home shows one card when the active theme is Mozarthitos.

## Options considered

Add a `user_events` type and call the existing ingest. Rejected. That route returns 401 when `auth.getUser()` is empty, so guest readers never appear.

## Consequences

- A new institute migration adds the table and both functions.
- The public route answers `Cache-Control: private, no-store`.
- Tests lock the unknown question id, the null visit id, the accordion post, and the card error codes.
- A cleared cookie or a new day counts as another person. That is the stated limit.
