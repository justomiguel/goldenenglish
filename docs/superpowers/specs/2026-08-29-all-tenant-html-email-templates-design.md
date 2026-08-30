# All-tenant outbound mail uses branded HTML templates

**Date:** 2026-08-29  
**Status:** Approved  
**Kind:** Design spec  
**Related:**
- [`2026-08-24-admin-email-send-toggles-design.md`](2026-08-24-admin-email-send-toggles-design.md)
- `src/lib/email/templates/sendBrandedEmail.ts` + `wrapEmailHtml.ts`
- `src/lib/email/templates/templateRegistry.ts`

**Governing rules:** `08-analytics-observability.mdc`, `09-i18n-copy.mdc`, `03-architecture.mdc`, `30-harness-self-contained-tests.mdc`.

## Intent

Every outbound email this app sends — on every tenant (same codebase, per-tenant Resend + brand) — arrives as a **branded HTML template**: logo, institute name, body, footer. Recipients never get a naked fragment, dictionary snippet, or text-only payload from our `EmailProvider`.

## Why it fails today

`sendBrandedEmail` already loads the registry/DB template and wraps with `wrapEmailHtml`. Several paths call `EmailProvider.sendEmail` with a raw body instead:

| Path | What goes out |
|------|----------------|
| Events (`notifyAttendeeViaResend`) | `email_templates` row or hardcoded fallback. **No wrap.** Not in the TS registry, so `sendBrandedEmail` cannot resolve the key. |
| Parent platform invite | `loadEmailTemplate` body sent raw. **No wrap.** |
| Parent bulk compose | Admin editor HTML sent raw. **No wrap.** |
| Password reset | Dictionary `emailPasswordReset.html`. **No wrap.** Not in the registry. |
| Admin “reset by DNI” notice | Dictionary HTML. **No wrap.** Not in the registry. |
| Site-contact visitor reply | Already wrapped; not a catalog template (composer body). Keep wrap. |

Messaging, billing, registration, churn, class reminders, and student/tutor welcomes already go through `sendBrandedEmail`. Tenants share this code; a leak on one tenant is a leak on all.

## Decisions

| Topic | Choice |
|-------|--------|
| Catalogued product mail | Must use `sendBrandedEmail` (registry key + wrap). |
| Ad-hoc staff-composed HTML (bulk parents, site-contact reply) | Must go through a small `sendWrappedHtmlEmail` that only applies `wrapEmailHtml` + provider. No fake template key. |
| Events | Add `events.*` keys to the registry (defaults = current fallbacks). Delete the parallel resolver. Use `sendBrandedEmail`. Existing DB overrides still win. |
| Password reset + admin reset notice | Move copy into the registry (`notifications.password_reset`, `notifications.admin_password_reset`). Call `sendBrandedEmail`. Drop dictionary HTML for those two. |
| Parent invite | Call `sendBrandedEmail({ templateKey: "notifications.parent_platform_invite" })` so the body is wrapped. |
| Provider contract | Keep `html: string` required. Do not add a text-only send API. |
| Tenants | No per-tenant fork. Brand + `RESEND_FROM` already come from each deploy. |
| Double-wrap | `wrapEmailHtml` is the only layout. Callers pass a **body fragment**, never a full document. |
| Auth emails we do not send | Supabase confirm-signup / magic-link if the project still lets GoTrue send them stay out of scope (dashboard SMTP/templates, not this app). |

## Approaches considered

1. **Wrap inside `ResendEmailProvider`.** Rejected: double-wrap risk, no locale/brand at that layer, tests and recordings would all look wrapped even for fragments.
2. **Only wrap the known leaks, leave events off-registry.** Rejected: events stay uneditable in admin Communications and easy to miss again.
3. **Registry + `sendBrandedEmail` for product keys; `sendWrappedHtmlEmail` for composer bodies (chosen).** One look, admin can edit catalogued copy, composers stay free-form inside the chrome.

## Done when

1. Grep of `emailProvider.sendEmail` / `getEmailProvider().sendEmail` outside providers, `sendBrandedEmail`, and `sendWrappedHtmlEmail` is empty in product code.
2. Events, password reset, admin reset notice, and parent invite produce HTML that contains the brand name and logo (same assertions as today’s `sendBrandedEmail` test).
3. Parent bulk and site-contact reply still send the author body, inside the wrap.
4. Isolated tests cover the new helper and the moved keys. Event notify tests use `sendBrandedEmail` (mocked provider), not a private resolver.
5. Admin template list shows the new keys (registry auto-discovery).

## Out of scope

- Changing Resend `from` / domains per tenant
- Seeding every registry default into `email_templates` (overrides remain optional)
- WhatsApp / in-app / SMS
- Regenerating `masterdb.sql`
- Customizing GoTrue’s own Auth emails in the Supabase dashboard
