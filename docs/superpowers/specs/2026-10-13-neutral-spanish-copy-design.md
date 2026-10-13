# Neutral Spanish copy

## Intent

The default `es` locale is shared by every tenant. Families outside Argentina read voseo (*tenés*, *hacé*, *ingresá*, *acá*) as local slang. User-facing Spanish is neutral Latin American Spanish with tuteo.

## Done when

- `.cursor/rules/40-neutral-spanish-copy.mdc` is `alwaysApply` and states the register. `09-i18n-copy.mdc` and `AGENTS.md` point at it.
- `src/dictionaries/es.json` and the Spanish email templates under `src/lib/email/templates/` no longer use voseo.
- Meaning, placeholders (`{{email}}`, `{{brandName}}`), and key structure stay the same. Shop “pedido” (an order) stays. A request to reset a password becomes “solicitud”.
- Tests that asserted an Argentine string match the new wording. A Vitest scan fails if voseo tokens return to `es.json`.

## Register

| Argentine (forbidden) | Neutral (required) |
|---|---|
| vos / tenés / podés | tú (often omitted) / tienes / puedes |
| Hacé clic / Usá / Ingresá / Intentá | Haz clic / Usa / Ingresa / Intenta |
| acá | aquí |
| escribinos | escríbenos |
| te vamos a pedir | te pediremos |
| un pedido (de restablecer) | una solicitud |
| inscripto / inscripta | inscrito / inscrita |
| imaginás | imaginas |

Keep Latin American vocabulary that is already neutral: *computadora*, *celular*, *correo*. Do not switch to peninsular Spanish (*vosotros*, *ordenador*) or to *usted*.

## Follow-up (same register)

- Dictionary, emails, and tests say *inscrito* / *inscrita*.
- The seeded web NPS prompt *imaginás* becomes *imaginas*, including databases that already stored the old sentence.
- Developer comments, runbooks, and older specs/plans that still use voseo use tuteo.
- Rule examples that quote a forbidden form stay, so the rule can show what not to write.

## Out of scope

- English and Portuguese.
- Brand names and document labels (DNI, RUT, pasaporte).
- Rewriting tone or length beyond the register change.
