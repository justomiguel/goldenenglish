# Registration funnel stages

**Intent:** Inscripciones shows one stage at a time. The actions panel shows only the button for that stage, beside Cerrar.

**Done when:**

- The toolbar chips are the funnel, in this order, with a count: Inscriptos, Inscriptos contactados, Contactados esperando pago, Pagados matrícula sin sección, Contactados esperando sección.
- A lead with a matrícula amount above zero never appears in Contactados esperando sección.
- A lead with no matrícula amount never appears in Contactados esperando pago or Pagados matrícula sin sección.
- The actions panel footer is the stage button, then Cerrar. Web and the narrow list use the same panel.
- Inscriptos offers Contactar: send a mail, open WhatsApp, or mark contacted.
- Inscriptos contactados, when a fee exists, offers the matrícula mail and Marcar pagado presencial.
- Contactados esperando pago offers the same mail again, the receipt when one exists, and Marcar pagado presencial.
- Pagados matrícula sin sección and Contactados esperando sección offer Asignar sección. Cuota al ingresar appears only there. The sentence does not mention matrícula.
- Assigning a section of the registered cohort sets the lead to enrolled. The row leaves the open list.
- A section from another cohort returns `section_cohort_mismatch`.

**Out of scope:** A new pay page. A new fee field. The all-statuses chip. Trial as its own chip.

## Stages

The matrícula amount is the section amount, else `academic_cohorts.default_enrollment_fee_amount`. Zero means no matrícula.

| Stage | Who is here | Panel button |
|---|---|---|
| Inscriptos | Not contacted | Contactar |
| Inscriptos contactados | Contacted, fee above zero, mail not sent, not paid | Enviar mail de matrícula, or Marcar pagado presencial |
| Contactados esperando pago | Fee mail sent, or a receipt is waiting, and not paid | Resend the mail, review the receipt, or Marcar pagado presencial |
| Pagados matrícula sin sección | Fee paid, no section | Asignar sección, plus Cuota al ingresar |
| Contactados esperando sección | No fee, contacted, no section | Asignar sección, plus Cuota al ingresar |

Mark contacted moves a fee lead to Inscriptos contactados. It moves a no-fee lead to Contactados esperando sección and creates the student account with no section.

The matrícula mail moves a fee lead to Contactados esperando pago. The mail links to the existing matrícula page. The family uploads a receipt or pays the matrícula amount on the gateway. The link is not the join-month charge.

A confirmed gateway payment, an approved receipt, or Marcar pagado presencial moves the lead to Pagados matrícula sin sección and creates the student account with no section. The row stays.

Cuota al ingresar is the join month only: al día, no al día, or beca. It is hidden until Asignar sección. Remove the sentence "matrícula si hay + mes de ingreso pagados".

The old chips leave the toolbar: Acciones, Esperando pago, Comprobante, Falta sección, Sección llena, Esperando respuesta, Contactados, Clase de prueba. A trial lead uses the same stages. A full section stays in its stage. Assign still lists sections of the cohort of `preferred_section_id`.

The default chip is Inscriptos.

## Actions panel

One panel per row. Edit and delete stay inside it, above the footer.

Footer, left to right: the stage button, then Cerrar. Targets are at least 44px. The stage button has a leading icon.

Web does not keep the matrícula, join-charge, or accept buttons on the row. The narrow card does not keep WhatsApp, accept, or matrícula controls on the card face. Those actions open from the panel.

Contactar offers three choices: a mail to the lead, WhatsApp when a phone exists, and Marcar contactado. Mail and WhatsApp do not change the stage. Marcar contactado does.

## Surfaces (Web vs PWA)

Tier B admin list. A PWA tree already exists: `AdminRegistrationsScreenNarrow`, `AdminRegistrationPwaCard`, `AdminRegistrationActionsSheet`.

- Web (`web-desktop`): the row opens the same actions panel. The funnel chips stay in `RegistrationListToolbar`.
- Narrow (`web-mobile` / `pwa-mobile`): the card opens the same panel. The sheet footer is the stage button beside Cerrar. Chips scroll on one row.

Shared hooks and actions keep one stage id. Do not fork the stage rules per surface.

## Data

Keep `enrollment_fee_paid_method`, amount, and paid_on from migration 271. Store that the matrícula mail was sent, so Inscriptos contactados and Contactados esperando pago stay distinct. Do not add a fee column.

Join billing still runs when the section is saved. Disposition default stays `{ kind: "behind" }` until staff picks one in that panel.

## Errors and logs

Each failure keeps its own code and sentence in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo. The log uses the same code with `[ge:server]`.

## Tests

Cover one fee lead through contact, mail, and paid-without-section. Cover a zero-fee lead that skips payment. Cover the unknown error code. Cover that Cuota al ingresar is absent before the section stage.
