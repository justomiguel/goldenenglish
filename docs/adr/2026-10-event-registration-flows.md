# Event registration flows

## Context

One event form is shown to every attendee. Staff need several paths (academy, courses plus championship, championship only), each with its own questions, while shared questions stay common. Price today is one residency pair for the whole event. A path may instead have its own amount. Those two prices must not apply together.

## Decision

Store flows in `event_registration_flows`. An extra field with `flow_id` null is shared; otherwise it belongs to one flow. `events.price_by_flow` defaults false and keeps residency pricing. When true, the chosen flow’s `price` is the seat price and residency is not charged. Ticket packages stay a third, separate catalog and cannot be combined with flow pricing.

## Options considered

- Always price by flow. Rejected: existing events keep one residency price.
- Reuse ticket packages as the paths. Rejected: packages already mean price and capacity, and a form path can exist without them.

## Consequences

Existing events have no flow rows, so the form and the price stay as they are. Enrollment records `registration_flow_id` when a path is taken. Tests cover which fields show, which fields are required, and which amount is charged.
