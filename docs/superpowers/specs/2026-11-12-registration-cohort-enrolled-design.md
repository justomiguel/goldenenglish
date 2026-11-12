# Inscripciones cohort filter and Inscritos stage

**Intent:** Staff pick one cohort on the Inscripciones list and see that cohort's funnel. The first arrow is Pre-inscritos. The last arrow is Inscritos and shows the section each student already has.

**Done when:**

- The list tab has a cohort selector above the arrows. The settings tab has no selector.
- The first visit selects the cohort that is open for inscriptions (`registration_cohort_id`, then the current cohort).
- A `cohort` query value that matches a cohort id selects that cohort. An unknown value falls back to the open cohort.
- Every arrow count and every list page uses the selected cohort. A cohort change resets the page to 1 and clears the batch marks.
- The first arrow label is Pre-inscritos. The new last arrow label is Inscritos.
- Inscritos lists registrations with status `enrolled` whose active section is in the selected cohort. The row shows that section name.
- The Inscritos popup can move the student to another section of that cohort. The payment and the account stay. The student stays on Inscritos.
- Back from Inscritos opens one confirm dialog. The dialog names the undo. Confirm drops the section and clears the matrícula payment. The student account stays.
- Inscritos has no checkbox and no batch bar.
- Web and the narrow list share the selector, the arrows, and the popup.

**Out of scope:** A batch move. A batch revert from Inscritos. Deleting the student account. A second confirm dialog. Changing the settings tab. Changing who may open the page.

## Cohort

The selector lists the institute cohorts. It sits above the funnel on the list tab only. The choice is the `cohort` search param. The other search params stay.

A lead with a preferred section belongs to that section's cohort. A lead with no preferred section belongs only to the cohort that is open for inscriptions. An enrolled student belongs to the cohort of each active section enrollment.

## Arrows

Add the stage id `enrolled_in_section` after `awaiting_section`. `registrationFunnelStage` still returns `null` for status `enrolled`. The panel treats status `enrolled` as `enrolled_in_section`. The list loader uses `enrolled_in_section` as its own filter. That filter reads status `enrolled` and an active `section_enrollments` row whose section is in the selected cohort.

The row shows the active section name. Two active sections in that cohort both appear in the same cell.

The page size stays 25. The batch bar and the row checkbox are absent on this stage.

Rename the registered arrow in `en.json`, `es.json`, and `pt.json`. Spanish uses Pre-inscritos for the first arrow and Inscritos for the last arrow. Portuguese and English get the same meaning. Do not leave the first arrow labeled Inscritos.

## Inscritos popup

The popup uses the same step block as the other stages. The sentence names the current section. The light button saves a move to another section of the selected cohort. The current section is not a choice. Edit, delete, and close stay in the ghost row.

A move sets every active enrollment in the selected cohort to `transferred` and inserts one `active` enrollment in the chosen section. The student then has one section in that cohort. Status stays `enrolled`. `fee_captured` and the paid columns stay. `revalidatePath` and `router.refresh()` run after success. `recordSystemAudit` stores `registration_section_move` with the registration id, the previous section ids, and the new section id.

## Back from Inscritos

Back opens `ConfirmActionModal` once. The body says the student leaves the section and the matrícula payment is cleared. The body says the account stays. When the cohort has no matrícula, the body says there is no payment to clear and the student returns to the waiting-for-section stage.

Confirm does all of this:

- Set each active enrollment in the selected cohort to `dropped`. Do not delete the row. Do not delete the profile.
- Clear `fee_captured`, `enrollment_fee_paid_method`, `enrollment_fee_paid_amount`, and `enrollment_fee_paid_on` on the registration when the lead has a matrícula. Leave those columns when the lead has no matrícula.
- Set `status` to `contacted`.
- Leave `accepted_student_id` in place.

The next stage follows the existing funnel rules after that patch. A fee lead whose matrícula mail was sent lands on `awaiting_payment`. A fee lead whose mail was not sent lands on `contacted`. A lead with no matrícula lands on `awaiting_section`.

`recordSystemAudit` stores `registration_funnel_revert` with `from_stage` `enrolled_in_section` and the next stage. Do not store the email.

## Errors

Each new cause has its own code and its own sentence in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo. The sentence includes the code. The log uses the same code.

- `section_move_same` — the chosen section is the current one. Pick another section.
- `section_move_outside_cohort` — the section is not in the selected cohort. Pick a section of this cohort.
- `enrolled_revert_failed` — the section or the payment could not be saved. Refresh the list and try again.
- `save_failed` — the move could not be saved. Refresh the list and try again.

An unknown code stays visible.

## Surfaces (Web vs PWA)

Tier B. The list already has a narrow tree. Do not fork the data or the popup.

- Web (`web-desktop`): the selector is a labeled select above the arrows in the list tab.
- Narrow (`web-mobile` / `pwa-mobile`): the same selector is full width above the arrows. The target is at least 44px. The popup stays in `AdminRegistrationActionsSheet`.

## Tests

- An unknown `cohort` value falls back to the open inscriptions cohort.
- A lead with no preferred section is included only for the open cohort.
- A lead with a preferred section is included only for that section's cohort.
- `enrolled_in_section` returns enrolled rows for the selected cohort and shows the section name. A registration in another cohort is absent.
- The registered arrow label is the Pre-inscritos sentence. The new arrow label is the Inscritos sentence.
- Move calls the move action with the new section id. The confirm body for a fee lead names the payment clear. The confirm body for a no-fee lead names the waiting-for-section return.
- The revert patch drops the enrollment, clears the fee columns only when a matrícula exists, keeps `accepted_student_id`, and lands on `awaiting_payment`, `contacted`, or `awaiting_section` as specified above.
- `section_move_same`, `section_move_outside_cohort`, and an unknown code each render their own sentence. The unknown sentence contains the raw code.
