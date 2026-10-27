# Event discount: fixed amount or percent

## Context

An event discount code was only a percent. Staff also need a fixed money amount off a chosen number of tickets in one registration. The public total and the later charge must use the same rule. The browser must not send the charged amount.

## Decision

Keep one row in `event_discount_codes`. A check allows either `discount_percent` or `discount_amount` plus `ticket_count`. The redemption copies the chosen columns when the person enrolls. `enroll_event_attendee_with_discount` and the payment gateway recompute the total from that snapshot.

## Options considered

A second table for amount codes would duplicate uses, redemptions, and the Excel flow. Extra columns on the percent Excel would mix two modes in one file. Both were rejected.

## Consequences

Migration `222_event_discount_fixed_amount.sql` is additive. Existing percent rows stay valid. A later edit of a code does not change an open payment. Tests cover the price rule, the two Excel files, the preview, and the gateway charge.
