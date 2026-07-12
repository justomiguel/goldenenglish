# Fix AdminEventPaymentReviewActions accessible-name test

**Intent:** Query approve/reject by visible button labels; assert tooltips via `title`, matching current Button markup (no aria-label = tooltip).

**Done when:** `AdminEventPaymentReviewActions.test.tsx` passes in isolation; precommit can proceed past this case.

**Out of scope:** Changing `AdminEventPaymentReviewActions` / Button aria behavior.
