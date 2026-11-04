# Trial class E2E

**Intent:** One Playwright spec proves a family can book a free trial, staff can mark the visit, and the admin home week card counts that visit.

**Done when:**

- Isolated seed sets `public_cta_mode` to `both` and adds section `E2E Trial` (`offers_trial`, fee 0, one slot every weekday at 23:00).
- `e2e/critical-registration-trial.spec.ts` runs in the existing `chromium-critical-registration` project.
- An anonymous adult opens `/register?intent=trial`. With one trial section, the form names `E2E Trial` and books it. With a picker, the adult selects that section. The success dialog opens.
- The week window passes the timezone as an explicit `Intl` option. A shorthand option is dropped when the production bundle inlines the function, and the home card then stays at zero.
- The public insert does not use `RETURNING`. Anon cannot select the new lead, so a returned id fails the insert.
- The admin opens the trial inbox row, sees status Reservada, and marks Presente. The row then shows Vino.
- When `scheduled_on` falls in the current Monday–Sunday window (`America/Argentina/Cordoba`), the home card `Pruebas de la semana` gains one booked count, then moves that count to usadas. When the date is next week, the card counts stay the same.
- `/register` without `intent` stays a reserve form.

**Out of scope:**

- A paid trial, Mercado Pago, or a receipt.
- Converting the visit into an enrollment.
- The PWA registrations card. It does not render the visit buttons. This spec uses Desktop Chrome.
- Resend. The isolated stack records mail and does not call the provider.

## Surfaces (Web vs PWA)

- Public register is Tier A. Web and PWA share `RegisterForm`. This spec drives the desktop form.
- Admin home and the registrations table are Tier B. The mark control lives in the desktop expanded row.
- No shared hook or prop change. The PWA registrations list stays as it is.
