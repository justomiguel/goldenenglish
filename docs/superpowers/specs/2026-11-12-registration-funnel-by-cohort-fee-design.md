# Registration funnel follows the cohort matrícula

**Intent:** Show one funnel when the selected cohort has a matrícula, and a shorter funnel when it does not.
**Done when:** Cohort 2027 (matrícula 55000) does not show "Contactados esperando sección". A cohort with no matrícula shows only pre-inscritos, contactados esperando sección, and inscritos.
**Out of scope:** Changing how a lead is marked contacted, and the cash amount rule from `2026-11-12-cash-matricula-cohort-first-design.md`.

## Decision

The selected cohort has a matrícula when `default_enrollment_fee_amount` is greater than 0.

With a matrícula, the arrows are:

1. Pre-inscritos
2. Pre-inscritos contactados
3. Esperando pago
4. Pagados
5. Inscritos con sección

Without a matrícula, the arrows are:

1. Pre-inscritos
2. Contactados esperando sección
3. Inscritos

A URL that names a hidden stage opens Pre-inscritos.

## Options considered

Keep every arrow and show a zero count. Rejected. Staff asked that the stage not appear.

## Consequences

- Web and PWA use the same arrow list. Counts for hidden stages are not shown.
- A lead that was only in the hidden stage stays in the matching visible stage. With a matrícula, a contacted unpaid lead stays in Pre-inscritos contactados.
- Copy for the shortened labels goes in `en.json`, `es.json`, and `pt.json`.

## Surfaces (Web vs PWA)

Tier B admin inbox. Desktop and the narrow PWA list both render `RegistrationFunnelArrows` from `RegistrationListToolbar`. The stage list is the same on both. Touch targets stay at least 44px. No second layout.
