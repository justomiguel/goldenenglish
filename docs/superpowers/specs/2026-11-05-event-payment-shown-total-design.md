# Event payment shown total

**Intent:** The event payment review list shows the total the registrant saw, after a code coupon and minor ticket prices.

**Done when:** A pending payment row uses `resolveEventRegistrationTotals`. A stored gross amount does not replace that total. New enrollments store the same number.

**Out of scope:** Changing the coupon rules. Changing gateway capture.

## Surfaces (Web vs PWA)

Tier B. The review list is the admin event payments tab. No PWA tree.
