# Admin mail on each purchase and each paid payment

**Intent:** Email every admin when someone buys event tickets, and when any payment becomes paid. The buyer mail stays as it is today.

**Done when:**

- A successful event registration sends one mail to each admin. Companions do not send a second purchase mail. The mail names the event, the buyer, the seat count, the amount, and whether payment is still pending.
- A payment that becomes paid sends one mail to each admin. This covers an event payment, a monthly tuition payment, and a shop order.
- A repeated gateway call does not send the admin mail again.
- A rejected payment and a payment delete do not send the paid mail.
- A receipt that stays pending approval sends one admin mail. This covers an event transfer receipt, a monthly tuition receipt, an enrollment-fee receipt, and an invoice receipt. A repeated event upload does not send again.
- A teacher article that moves to review sends one admin mail. The mail names the article.
- A paid enrollment that still needs a schedule sends one admin mail. This covers a full section and a payment with no section. A send failure is logged and does not undo the payment or the accept.
- A send failure is logged and does not undo the purchase or the payment.
- Copy lives in the email template registry for `es`, `en`, and `pt`.

**Out of scope:**

- A second admin mail for public registration. That flow already emails admins.
- A mail when staff reject a receipt, or when staff record a payment without a receipt. The paid mail already covers that record.
- A new admin preference to mute these mails.
- In-app portal messages.

## Decision

Reuse the admin list from `sendRegistrationAdminEmails`: profiles with role `admin`, then the auth email, skip the public-contact sender. Send with `sendBrandedEmail`.

Two templates:

- `events.admin_registered` — sent from `enrollEventAttendeeServer` after the attendee row is stored.
- `payments.admin_paid` — sent only when the payment first becomes paid.
- `payments.admin_receipt_pending` — sent after a buyer or family uploads a receipt that still needs approval. Event uploads call it from `uploadEventPaymentReceiptServer` only after the row is stored. Monthly uploads call it from `notifyPaymentReceiptPending`. Enrollment-fee uploads call it from the student and tutor submit actions. Invoice uploads call it from `uploadBillingReceipt` after the receipt row is stored.
- `blog.admin_pending_review` — sent from `submitForReviewAction` after the article status becomes `pending_review`.
- `registration.admin_needs_section` — sent from `finalizeAcceptedRegistrationLead` when a paid accept has no section.
- `registration.admin_section_full` — sent from `applyEnrollmentGatewayCapture` when the paid section is full, and from `finalizeAcceptedRegistrationLead` when every requested section stayed pending.

Event payments use `markEventPaymentApprovedCore`, and only when `paymentUpdated` is true. Monthly tuition uses the approved branch of `notifyMonthlyPaymentDecision` and `notifyAdminRecordedPayment`'s call sites. Shop uses `markShopOrderPaid` when the result is `paid`, not `already_paid`.

Rejected alternative: one template for both facts. Staff need the purchase even when the transfer is still pending, and a later paid mail when the money arrives.
