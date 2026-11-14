# Registration actions — contact note, one close, colored row

**Intent:** In the Inscripciones actions popup, each explanation is a tooltip. Contact is a choice with "or" between mail and WhatsApp. Remove the extra Close at the bottom. Put Edit request and Delete on one row, each with a color.

**Done when:** The popup opens on the person: surname and given name, then document, mail, phone, birth date, and level when they exist. A tutor block follows when the file has a tutor. On the pre-enrolled stage, a desk photo sits on the left under that card. Mail and WhatsApp stack on the right, with "or" between them when a phone exists. Each choice has its own tooltip. Under that, a line reads "After you speak, mark the contact." Mark contacted is a green button. Its section is not green. The step sentence stays in a tooltip on that section. Mail sends from this page. WhatsApp opens the app. The bottom Close button is gone on every stage. The modal header still closes the popup. Edit request and Delete sit side by side. Edit request uses the primary fill. Delete uses the destructive border. Web and the narrow actions sheet share this panel.

**Out of scope:** The matrícula mail button. The back-one-step button. New analytics. An ADR.

## Surfaces (Web vs PWA)

Tier B admin. Both surfaces already open the same panel.

- **Web (`web-desktop`):** `AdminRegistrationTableRow` opens a `Modal`. The header close stays. The panel footer loses its Close button.
- **PWA (`web-mobile` / `pwa-mobile`):** `AdminRegistrationActionsSheet` uses the same `AdminRegistrationFunnelPanel`. The sheet gets the same note, the same row, and no extra Close. Touch targets stay at least 44 px.

The enrolled stage uses `AdminRegistrationEnrolledPanel`. That panel has no mail or WhatsApp. It only loses the bottom Close and puts Edit and Delete on one colored row.

## Copy

Add these keys under `admin.registrations.funnel` in `en.json`, `es.json`, and `pt.json`.

- `contactChoose` — Elige cómo contactar / Choose how to contact / Escolha como contactar
- `contactOr` — o / or / ou
- `mailTip` — Enviar mail manda el mensaje desde esta página, a la dirección de esta ficha.
- `whatsappTip` — WhatsApp abre la aplicación.
- `stepInfo` — Información del paso

Spanish uses neutral tuteo.

## Tests

Update `AdminRegistrationFunnelPanel.test.tsx`. Assert the hint on the pre-enrolled stage. Assert no Close button. Assert Edit and Delete stay reachable.
