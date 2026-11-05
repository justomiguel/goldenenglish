# Event minor ticket maximum age

## Context

An event can sell a cheaper ticket for minors. The public copy said the age is checked at the event and did not say the cutoff.

## Decision

Store `public.events.minor_max_age` as a nullable smallint from 1 to 99. The number is inclusive. The public event page and the registration form show it. A missing value keeps the previous sentence. Enrollment still does not compare a birth date with this number.

## Options considered

- One institute-wide legal age. Rejected. Each event needs its own cutoff.
- Free-text legend. Rejected. The site would depend on each wording of the same fact.

## Consequences

- Migration `263_event_minor_max_age.sql`.
- Saving minor tickets without an age returns `minor_max_age_required`.
- The pricing save writes `system_config_audit` with `minor_max_age` only.
