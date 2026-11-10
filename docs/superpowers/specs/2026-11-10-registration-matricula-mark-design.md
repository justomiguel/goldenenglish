# Inscripciones — matrícula before alta

**Intent:** When a cohort or a section has a matrícula, the student account is created only after that fee is paid. The family pays from one mail, or staff mark the fee as paid in person. The same pre-inscription shows the receipt, the Mercado Pago result, or the in-person mark. The alta creates an approved student and does not enrol a section. The row stays in Inscripciones until staff assign a section from the cohort the person registered for.

**Done when:**

- A lead whose effective matrícula is above zero cannot use "Dar de alta" until the fee is confirmed.
- The row has "Enviar mail de matrícula" and "Marcar pagado presencial".
- The mail opens the existing matrícula page. The family pays with Mercado Pago or uploads a receipt.
- Mercado Pago confirmed: the row says "Pagó por Mercado Pago". The alta runs.
- Receipt uploaded: the row shows the file and "Comprobante por revisar". Approving it runs the alta.
- In-person mark: the row says "Pagó presencial". The alta runs.
- The alta creates the student with role student. It does not enrol the requested section. The row stays in the open Inscripciones list and says "Alumno aprobado, sin sección".
- That row offers "Asignar sección". The options are the sections of the cohort of `preferred_section_id`. The open inscriptions cohort is not the source of those options.
- Saving that enrollment enrols the student in the chosen section. The row then leaves the open Inscripciones list.
- A section from another cohort is rejected with code `section_cohort_mismatch`.
- A zero matrícula still allows alta without this payment. That alta also leaves the student without a section, and the row stays until a section of the registered cohort is assigned.
- Web and the narrow list show the same row state.
- The open inbox stays the default. An approved student without a section remains in that inbox.

**Out of scope:** A new pay page. A new fee field. The matrícula is the section amount, else the cohort default. Push or deploy.

## Payment

1. Staff send the mail from the pre-inscription, or mark the fee as paid in person on that row.
2. If they send the mail, the family opens one link.
3. The family chooses Mercado Pago or a receipt upload.
4. The same row updates:
   - Mercado Pago success shows "Pagó por Mercado Pago".
   - A receipt shows the file and waits for approval.
   - An in-person mark shows "Pagó presencial".
5. Only a confirmed payment creates the student.
6. The student is approved and has no section. The pre-inscription stays on the list.
7. Staff choose a section from the cohort of the section they registered for.
8. The row leaves Inscripciones only when that enrollment is saved.

## Surfaces (Web vs PWA)

Tier B. The narrow tree exists.

| Surface | Change |
|---|---|
| Web desktop | Mail button, in-person mark, receipt preview, paid status, and "Alumno aprobado, sin sección" on the row. The section select lists that registration's cohort. |
| Narrow / PWA | The same states on the card. The select and the save control stay at least 44 px. |

## Tests

- A fee above zero blocks alta until the payment is confirmed.
- A Mercado Pago capture creates the student, does not enrol a section, and the row stays in the open list.
- A receipt stays visible until staff approve it. Approval creates the student without a section and keeps the row.
- An in-person mark creates the student without a section, shows "Pagó presencial", and keeps the row.
- The section options for that row belong to the cohort of `preferred_section_id`.
- A section from another cohort returns `section_cohort_mismatch`.
- After a saved enrollment in that cohort, the open list no longer returns that row.
- A zero fee still allows alta, leaves the student without a section, and keeps the row until a section of that cohort is assigned.
