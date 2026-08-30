# Privacy and terms on pre-inscription (reserve + trial)

**Date:** 2026-08-29
**Status:** Approved (approach A)
**Kind:** Design spec

## Intent

Give families a plain-language page that explains what the institute does with enrollment data, and require an explicit (unchecked) acceptance on **Reservá tu cupo** and **Agendá tu clase de prueba** before submit.

## Decisions

| Topic | Choice |
|-------|--------|
| Route | `/{locale}/privacidad` |
| Pages | One combined page (promise, what, why, who, security, rights, short terms) |
| Checkbox | Required, **unchecked** by default, link opens the page in a new tab |
| Forms | Same `RegisterForm` for reserve and trial (and `/i/...` section links) |
| Copy | Dictionaries `en` / `es` / `pt`; interpolate `{{brand}}` from `brand.legalName` |
| Payments | **Do not** say that minors’ data goes to Mercado Pago, Flow, or any payment company. Do not list those companies as recipients of the student file. |
| Persist | Server requires `privacy_accepted: true`. No new DB column in this pass. |
| Events | Out of scope (already have their own consent) |
| Nago protocol | Unchanged; privacy tick is in addition |

## Who sees data (copy rule)

Staff of the institute only. The student file (including a minor’s document and birth date) stays in the institute system. We do not sell, publish, or hand that file to outside companies.

## Non-goals

- CMS-editable legal text
- Cookie banner
- AAIP database registration
- Changing event registration consent
- Mentoring parents through a lawyer-grade contract
