# Public enrollment pay page

## Intent

The public pay page shows the enrollment fee, the currency, and the payment options. A transfer receipt returns home after a confirmation or an error. A gateway return shows the error or moves the lead to paid without a section.

## Done when

- The pay state shows the fee label, the formatted amount, and the currency code.
- The pay state does not mention seat pressure.
- The pay state always offers three choices: report a cash payment, pay online, and upload a receipt.
- A cash report stays in awaiting payment. The admin table and the PWA card show the report as a chip. The funnel does not advance.
- Transfer shows the bank text when it exists. The file control is a secondary button. Send stays off until a file is chosen.
- A saved receipt shows the confirmation, then the browser goes to the locale home.
- A receipt error stays on the page with its own sentence.
- Flow and Mercado Pago return through a bridge. A confirmed payment sets `fee_captured` and `needs_section`. A rejected payment shows the rejection sentence and keeps the options.
- The admin registrations page lists the receipt while the lead waits.
- A back step that lands on awaiting payment clears `enrollment_fee_receipt_path` and deletes the file in `payment-receipts`.
- The section list for every stage uses the selected cohort. A paid lead with no preferred section still sees those sections and can join one.
- The join-month line uses the first available month of the selected cohort. A future cohort shows its start month. The saved month uses the section dates, or that section's cohort dates when the section dates are empty.

## Surfaces (Web vs PWA)

Tier A public page. There is one column and no separate PWA tree. Phone and desktop use the same screen.

## Out of scope

- Auto-enroll after the gateway payment.
- Batch mail.
