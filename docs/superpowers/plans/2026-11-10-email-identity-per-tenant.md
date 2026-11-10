# Phase 9 — Email identity per tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-email-identity-per-tenant-design.md`
**Depends on:** phase 1 (tokens, font catalog) and phase 3 (published document read).

**Goal:** Every email uses the identity of the tenant that sends it, also from jobs and cron. No email uses Golden blue by default.

**Architecture:** A pure `deriveEmailTokens` turns `DesignTokensV1` into a small email token set with contrast fallbacks. `wrapEmailHtml` reads only those tokens. `sendBrandedEmail` takes an explicit `tenantSlug`. It loads identity with `loadEmailIdentity`, and it fails with `email_tenant_missing` when no tenant is known.

**Tech Stack:** Table-based HTML email with inline styles, Resend through the existing sender, Vitest snapshots.

## Global Constraints

- `wrapEmailHtml.ts` contains no hex literal after this phase. A test enforces it.
- Each email text pair at 4.5:1. A failing pair falls back to the neutral default pair.
- `radius` capped at 16 px.
- Font stack: catalog family first, then `Arial, Helvetica, sans-serif` (sans) or `Georgia, 'Times New Roman', serif` (serif).
- Settings: `email.header` = `logo | logo_name | name` (default `logo_name`), `email.accentBar` toggle (default off).
- Code `email_tenant_missing`, log scope `email.identity`. No fallback to another tenant.
- Stored template bodies still pass `sanitizeEmailTemplateHtml` (rule 17).
- Test send goes only to the signed-in admin's email.

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/email/identity/deriveEmailTokens.ts` | Pure token derivation. |
| Create | `src/lib/email/identity/emailFontStack.ts` | Pure font stack from catalog ids. |
| Create | `src/lib/email/identity/server/loadEmailIdentity.ts` | Document + brand read per tenant. |
| Modify | `src/lib/email/templates/wrapEmailHtml.ts` | Tokens, header option, accent bar. |
| Modify | `src/lib/email/templates/sendBrandedEmail.ts` | `tenantSlug` param, identity load, failure code. |
| Modify | 24 callers of `sendBrandedEmail` | Pass `tenantSlug`. |
| Modify | `src/lib/theme/systemPropertiesDefaults.ts` | Neutral email defaults. |
| Modify | `src/app/[locale]/dashboard/admin/communications/templates/page.tsx` and its client | Preview and test send. |
| Create | `src/app/[locale]/dashboard/admin/communications/templates/sendTestEmailAction.ts` | Test send. |
| Modify | `src/dictionaries/{en,es,pt}.json` | Labels and codes. |
| Test | `src/__tests__/lib/email/identity/*.test.ts`, `src/__tests__/lib/email/wrapEmailHtml.test.ts`, `src/__tests__/lib/email/sendBrandedEmail.tenant.test.ts`, `src/__tests__/app/sendTestEmailAction.test.ts` | |

## Tasks

### Task 1: Email tokens

**Produces:**

```ts
export interface EmailTokens {
  canvas: string; card: string; text: string; textMuted: string;
  accent: string; accentText: string; link: string; border: string;
  radius: string; fontStack: string; headingFontStack: string;
}
export function deriveEmailTokens(tokens: DesignTokensV1): EmailTokens;
export function emailFontStack(fontId: string): string;
```

- [ ] Red: `deriveEmailTokens.test.ts`.
  - Golden defaults give `accent` = Golden primary and `link` = primary.
  - A pale primary on a white card gives `link` = `text`.
  - A failing `text` on `card` gives the neutral pair from defaults.
  - `radius: "2rem"` gives `16px`.
  - Two different token sets give different `accent` values.
- [ ] Red: `emailFontStack.test.ts`. `dm-sans` → `'DM Sans', Arial, Helvetica, sans-serif`. `fraunces` → serif fallback. An unknown id → the default sans stack.
- [ ] Green. Use `contrastRatio.ts`.

### Task 2: Wrapper on tokens

**Produces:**

```ts
export function wrapEmailHtml(input: {
  bodyHtml: string; brand: BrandPublic; tokens: EmailTokens;
  header: "logo" | "logo_name" | "name"; accentBar: boolean; locale: Locale;
}): string;
```

- [ ] Red: `wrapEmailHtml.test.ts`.
  - The source file has no `#[0-9a-f]{3,6}` match (read the file text).
  - Snapshots for two tenants differ in colors and fonts.
  - `header: "name"` renders no `<img>`.
  - `accentBar: true` renders a top row in `accent`.
  - The footer has the legal name, the contact email, and the social links from the brand.
- [ ] Green. Keep the table layout and inline styles. Move the current neutral grays into `SYSTEM_PROPERTIES_DEFAULTS` as `email.neutral.*` keys.

### Task 3: Tenant context and callers

**Produces:**

```ts
export async function loadEmailIdentity(tenantSlug: string): Promise<
  { ok: true; brand: BrandPublic; tokens: EmailTokens; header: "logo" | "logo_name" | "name"; accentBar: boolean }
  | { ok: false; code: "email_tenant_missing" }>;
// sendBrandedEmail(input: { tenantSlug: string | null; … existing fields })
```

- [ ] Red: `sendBrandedEmail.tenant.test.ts`.
  - `tenantSlug: "a"` sends with A's accent.
  - `tenantSlug: null` with a request host resolves the host tenant.
  - `null` with no host returns `{ ok: false, code: "email_tenant_missing" }`, logs scope `email.identity`, and calls no sender.
  - An unknown slug returns the same code.
- [ ] Green. Make `tenantSlug` a required key (value may be `null`) so `tsc` lists every caller.
- [ ] Fix each caller. Request paths pass `null`. Job and cron paths pass the slug from the job context (`getAlsTenant()?.slug` from `src/lib/tenant/tenantAls.ts`, or the job payload).
- [ ] Red: a class reminder test. The job for tenant A sends A's identity while the request store holds no host.
- [ ] Run `npx tsc --noEmit`. Expect no error.

### Task 4: Preview and test send

- [ ] Red: `sendTestEmailAction.test.ts`.
  - Admin only (`assertAdmin`).
  - It sends to the session user's email and ignores any address in the input.
  - The body passes `sanitizeEmailTemplateHtml`.
  - A failure returns the sender code and logs scope `email.testSend`.
  - Success calls `recordSystemAudit` with `action: "email_test_send"`.
- [ ] Red: the templates screen test. The preview `iframe` `srcDoc` contains the tenant accent. The "Send test to me" button has the `Send` icon and shows the coded error sentence on failure.
- [ ] Green. Add `email.header` and `email.accentBar` controls on the same screen. They save to the theme properties through the existing settings action, with `revalidatePath` and `router.refresh()` (rule 27).

### Task 5: Copy, changelog, commit

- [ ] Dictionary keys for the controls, `email_tenant_missing`, and the test send result. Run `neutralSpanishCopy.test.ts`.
- [ ] `npx vitest run src/__tests__/lib/email src/__tests__/app/sendTestEmailAction.test.ts`, `npx tsc --noEmit`, `npx eslint`.
- [ ] Changelog row `email-identity`, area `communications`.
- [ ] Commit spec + plan + code. Do not push.

## Manual QA (user)

- Send a test email from Golden and from Nago. Compare the header, colors, and footer in Gmail and Outlook.
- Trigger a class reminder on a non-Golden tenant and check the colors.

## Self-review

- Spec sections 1–5 map to tasks 1–4. Section 5 tests are in tasks 1–3.
- `EmailTokens` and `loadEmailIdentity` are new. They do not change phase 3 names.
