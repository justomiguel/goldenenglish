# Registration funnel arrows, step back, and contact mail

**Intent:** The Inscripciones stages look like one joined arrow. Staff can move a lead one stage back and undo that step. Contact mail opens a composer in the actions panel and sends the institute email.

**Done when:**

- The five stages are one horizontal arrow. Each stage is a segment that shares an edge with the next. Counts stay on the segment. The active segment is the pressed one.
- Inscriptos has no back control.
- Any later stage shows Volver a la etapa anterior in the actions panel. A confirm dialog names the stage the lead returns to.
- Back from Inscriptos contactados sets status to new and clears contacted_at and contacted_by. The lead appears in Inscriptos.
- Back from Contactados esperando pago clears enrollment_fee_mail_sent_at. If intake_state is receipt_pending, set it to none. The lead appears in Inscriptos contactados.
- Back from Pagados matrícula sin sección clears fee_captured, enrollment_fee_paid_method, enrollment_fee_paid_amount, and enrollment_fee_paid_on on the registration. The student account stays. The lead appears in Contactados esperando pago when the fee mail was sent or a receipt is still pending. Otherwise the lead appears in Inscriptos contactados.
- Back from Contactados esperando sección sets status to new and clears contacted_at and contacted_by. The student account stays. The lead appears in Inscriptos.
- A lead with status enrolled has no back control on this screen.
- Enviar mail in Contactar opens a composer in the same panel. The To field is the registration mail (tutor_email, else email) and is read-only. Staff write the message. Send wraps that HTML in the institute email chrome and sends it. The stage does not change.
- The matrícula mail stays the payment-link mail.

**Out of scope:** A new pay page. Deleting a student account. Removing a section from an enrolled lead. Changing last_enrollment_paid_at. The all-statuses chip. A new fee column.

## Arrows

Replace the rounded stage chips in `RegistrationListToolbar` with one `role="group"` of buttons. Draw each button as a chevron that meets the next chevron. Do not use `rounded-full`.

Order stays: Inscriptos, Inscriptos contactados, Contactados esperando pago, Pagados matrícula sin sección, Contactados esperando sección.

The pressed button uses `aria-pressed="true"`. Targets are at least 44px tall. On a narrow viewport the row scrolls sideways. The default stage stays Inscriptos.

## Step back

One server action, `revertRegistrationFunnelStage`. It reads the current stage from `registrationFunnelStage` and writes only the fields for that step.

| From | Write | Account |
|---|---|---|
| contacted | status new, contacted_at null, contacted_by null | none yet |
| awaiting_payment | enrollment_fee_mail_sent_at null; receipt_pending becomes none | unchanged |
| paid_without_section | fee_captured false; paid method, amount, and date null | keep accepted_student_id |
| awaiting_section | status new, contacted_at null, contacted_by null | keep accepted_student_id |
| registered or enrolled | refuse with `funnel_revert_not_allowed` | unchanged |

`paid_without_section` is true only when `feeCaptured` is true. `awaiting_section` is true only when there is no fee and status is contacted. An accepted student with status new and no fee stays in Inscriptos. An accepted student with a fee and `feeCaptured` false is not Pagados matrícula sin sección.

Update `applyRegistrationFunnelFilter` and `countRegistrationInboxFilters` with the same rules. `recordSystemAudit` stores the action, the registration id, and the stage left. Do not store the mail body or the payment amount in the user-facing sentence.

Confirm with `ConfirmActionModal` before the action. After success, `revalidatePath` and `router.refresh()`.

## Contact mail

Enviar mail replaces the `mailto:` link. The composer sits in `AdminRegistrationFunnelPanel`: read-only To, `RichTextEditor`, Send with a leading icon.

The action sanitizes HTML with `sanitizeMessageHtml`. An empty body returns `empty_message`. A missing address returns `missing_registration_email`. Send with `sendWrappedHtmlEmail`. A provider failure returns `registration_contact_email_failed` and logs `[ge:server]` with scope `revertRegistrationFunnelStage` or `sendRegistrationContactEmail` and the registration id. Do not log the address.

The matrícula button still calls `onStartEnrollmentFee`.

## Surfaces (Web vs PWA)

Tier B admin list. The PWA tree is `AdminRegistrationPwaCard` and `AdminRegistrationActionsSheet`. Both surfaces use the same panel.

- Web (`web-desktop`): the arrow row is in the toolbar. The row opens the panel. The composer and the back button are inside that panel.
- Narrow (`web-mobile` / `pwa-mobile`): the same arrow row scrolls. The card opens the same panel in the sheet. The composer and the back button are inside that sheet. Targets stay at least 44px.

## Errors

Each code has its own sentence in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo. The sentence names the cause and the next step, and includes the code. An unknown code stays visible.

## Tests

- A fee lead walks back from paid to awaiting payment, then to contacted, then to registered. The student id remains after the paid step is undone.
- A zero-fee lead walks back from awaiting section to registered. The student id remains.
- Enrolled and registered refuse with `funnel_revert_not_allowed`.
- The toolbar renders one arrow group and no `rounded-full` stage chip.
- Send mail calls the wrapped-email action with the tutor address. A missing address shows `missing_registration_email`. An unknown code stays in the message.
- The matrícula mail control is still present on the payment stage.
