# Event registration form — specific failure copy

**Intent:** The public event form shows one sentence for almost every failure: "No pudimos procesar tu inscripción. Intenta nuevamente." Replace that sentence with the reason the server already returns (missing field, invalid email, closed event, duplicate document, no seats, and the other stable codes).

**Done when:**

- A failed enroll shows a dictionary sentence for each known code.
- A required extra field names that field.
- An enroll result that is not `confirmed`, `payment_pending`, or `waitlist` does not open the success dialog.
- `en.json`, `es.json`, and `pt.json` carry the same keys. Spanish uses tuteo.
- Vitest covers the code map and the submit hook.

**Out of scope:** Captcha provider, payment gateway copy that already has its own sentence, admin event editors.

## Surfaces (Web vs PWA)

Tier A. `EventRegisterSurfaceEntry` mounts `EventRegisterDesktop` and `EventRegisterPwa`. Both render `EventRegisterForm`. The alert stays in `EventRegisterFormFooter`. Web and PWA get the same sentence. No new control, no layout change. The sentence wraps in the existing alert paragraph.

## Behavior

1. `POST /api/events/[slug]/enroll` turns a Zod issue into a stable code (`email_invalid`, `first_name_required`, `required_field_missing:<id>`, and the codes the schema already sets).
2. The client maps that code, and `result.resultCode` when the HTTP call succeeds but enrollment did not, to `events.register.errors`.
3. Unknown codes keep the existing generic sentence.
4. `insufficient_seats` uses the remaining count. `too_many_tickets` uses the maximum when the response includes it.
