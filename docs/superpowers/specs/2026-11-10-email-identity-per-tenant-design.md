# Phase 9 — Email identity per tenant

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 1 (tokens, font catalog, contrast validator), phase 3 (published document).

## Understanding

- Families and staff read institute emails. Each email must look like its own institute: logo, colors, fonts, and footer.
- Email clients do not run CSS variables or web fonts reliably. Tokens must become inline styles at send time.
- The text of each template stays in the existing template system.

## Current state (checked 2026-11-10)

1. `sendBrandedEmail` (`src/lib/email/templates/sendBrandedEmail.ts`) reads `getBrandForRequest()` and wraps the body with `wrapEmailHtml`.
2. `wrapEmailHtml.ts` hardcodes colors: `#103A5C` (Golden primary) for the header name and links, `#f3f4f6`, `#111827`, `#e5e7eb`, `#6B7280`, `#374151`. Every tenant sends Golden blue.
3. `email_templates` (migration `054_email_templates.sql`) stores admin overrides per `template_key` and `locale`. Bodies pass `sanitizeEmailTemplateHtml` (rule 17).
4. Cron and job senders (class reminders, billing) also call `sendBrandedEmail`. In a job there is no request host, so the tenant must come from the job context.

## Decision

### 1. Email tokens

Derived from the published `DesignTokensV1` in a pure function `deriveEmailTokens(tokens)` in `src/lib/email/identity/`:

| Email token | Source |
|---|---|
| `canvas` | `color.muted` lightened, or a neutral default |
| `card` | `color.surface` |
| `text` | `color.foreground` |
| `textMuted` | `color.muted.foreground` |
| `accent` | `color.primary` |
| `accentText` | `color.primary.foreground` |
| `link` | `color.primary`, or `color.foreground` when the pair fails AA on `card` |
| `border` | `color.border` |
| `radius` | `radius.card`, capped at 16 px |
| `fontStack` | catalog family of `font.body` + safe fallbacks |
| `headingFontStack` | catalog family of `font.heading` + safe fallbacks |

- Each text pair is checked at 4.5:1. A failing pair falls back to the neutral default for that pair. It never sends unreadable text.
- Font stacks name the web font first, then system fonts. Clients without the web font show the fallback.

### 2. Wrapper

- `wrapEmailHtml` takes `emailTokens` and the brand. It has no hex literals. Defaults live in `SYSTEM_PROPERTIES_DEFAULTS`.
- Header options from the published document: `email.header` = `logo`, `logo_name`, or `name`. Default `logo_name`.
- Footer: legal name, contact email, address, and social links from the brand layer. Unsubscribe or preference links stay as today.
- Optional accent bar at the top (`email.accentBar` toggle).
- The wrapper stays table-based with inline styles for client support.

### 3. Tenant context outside requests

- `sendBrandedEmail` accepts an explicit `tenantSlug`. Jobs and cron handlers pass it. A request path still resolves it from the host.
- `loadEmailIdentity(tenantSlug)` reads the published document and the brand with the same cache as the public site.
- No tenant and no request host: the send fails with `email_tenant_missing` and logs `[ge:server]` scope `email.identity`. It never falls back to another tenant.

### 4. Preview and test send

- The CMS email templates screen shows a preview with the tenant identity.
- A "Send test to me" button sends to the signed-in admin only. Icon `Send` (rule 16).

### 5. Tests

- Snapshot of the wrapper for two tenants with different tokens. The outputs differ in colors and fonts.
- Contrast fallback test with a failing palette.
- Job path test: a class reminder for tenant A uses A's identity.
- Unknown tenant path returns `email_tenant_missing`.

## Options considered

| Option | Why rejected |
|---|---|
| Free HTML wrapper per tenant | Breaks sanitizing (rule 17) and email client support. |
| CSS `<style>` blocks with variables | Many clients strip `<style>` or ignore variables. |
| MJML or React Email | New dependency category. Current wrapper is small and table-based. |
| Keep one neutral look for all | The user asked for identity per tenant in emails. |

## Surfaces (Web vs PWA)

- **Email:** not a web surface. Mobile email clients get a 560 px max width and 44 px tap targets on buttons.
- **CMS email templates screen (Tier B):** preview and test send. Desktop-only.

## Plan outline

1. TDD `deriveEmailTokens` with contrast fallback.
2. Refactor `wrapEmailHtml` to tokens. Snapshot tests.
3. `tenantSlug` in `sendBrandedEmail` and every job caller. `email_tenant_missing`.
4. Preview and test send in the CMS.
5. Dictionaries in `en`, `es`, `pt`. Changelog row (rule 39).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| A job sends with the wrong tenant | Explicit `tenantSlug` is required in job callers. A test per job handler. |
| Dark mode clients invert colors | Keep text and background as explicit pairs. Test in the manual QA list. |
| Large logos | Use the resized brand logo URL, max 240 px wide. |

## Definition of done

- `wrapEmailHtml` has no hex literals and no tenant names.
- Two tenants send visibly different emails (snapshot test).
- Every job caller passes `tenantSlug`.
- Preview and test send work in the CMS.

## Out of scope

- Template text editing (exists today).
- Email layout variants beyond header and accent options.

## Manual QA (user)

- Send a test email from two tenants. Open in Gmail web, Gmail Android, Apple Mail iOS, and Outlook. Check logo, colors, fonts, footer, and dark mode.
