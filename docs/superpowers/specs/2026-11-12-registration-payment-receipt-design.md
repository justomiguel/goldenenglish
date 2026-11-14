# Awaiting payment receipt and gateway capture

## Intent

In the awaiting-payment list, show the uploaded transfer receipt so staff can open it and approve it. A confirmed MercadoPago or Flow payment sets the fee as captured and leaves the lead in paid-without-section. It does not create the student and it does not enroll a section.

## Done when

- The desktop row and the PWA card show "view receipt" when `enrollment_fee_receipt_path` is set.
- The awaiting-payment popup keeps the approve action and also opens that file.
- `applyEnrollmentGatewayCapture` writes `fee_captured` and `intake_state = needs_section`. It does not call `acceptRegistrationLead`.
- A successful receipt upload revalidates the registrations page.

## Out of scope

- Batch actions.
- Auto-enroll after a gateway payment.
- A new payment provider.

## Surfaces (Web vs PWA)

Tier B admin. Desktop table and PWA card both show the receipt link. They share the same server action for the signed URL.
