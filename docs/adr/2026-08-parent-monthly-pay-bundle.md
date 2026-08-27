# ADR: Parent monthly multi-section checkout bundle

**Date:** 2026-08-26

## Context

`payments` stays one row per `(student_id, section_id, month, year)`. Parents asked to pay every payable section of a child for a month in **one** receipt or gateway charge.

## Decision

Persist a `payment_monthly_checkout_bundles` row (student, month, section ids, expected total) at checkout start. Flow maps `commerce_ref` → `bundle_id`. Mercado Pago uses `tuition-bundle:<bundleUuid>`. On confirm, the captured amount must equal the sum of current plan amounts; each section is approved with **its** plan amount. Abandoned checkouts still create no `payments` rows.

## Consequences

Single-section checkout is unchanged. Finance still sees per-section rows. If the sum drifts after capture, nothing is materialized (`amount_mismatch`); staff reconcile the gateway charge.
