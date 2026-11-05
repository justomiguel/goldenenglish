# Event payment discount lines

**Intent:** Under the total on a payment waiting for approval, show the adult line, the minor line, and the coupon or family discount.
**Done when:** A row with a code or a minor price shows those lines. A row with no discount shows only the total.
**Out of scope:** Finance hub, the attendee table, and gateway capture.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The lines sit on `AdminEventPaymentReviewRow`. No shared Tier A hook changes.
