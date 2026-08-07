# Mozarthitos contact email in mail templates

**Intent:** Fix outbound / preview email footers for Mozarthitos showing Golden English’s default `crisins@hotmail.com` instead of `mozarthitos@gmail.com`.

**Done when:**
- Active theme row `site_themes.slug = 'mozarthitos'` has `properties->>'contact.email' = 'mozarthitos@gmail.com'` (and `contact.phone` / `social.instagram` restored if still missing on that row).
- `loadEffectiveProperties()` → `getBrandPublic().contactEmail` resolves to `mozarthitos@gmail.com` for Mozarthitos (not `SYSTEM_PROPERTIES_DEFAULTS`).
- Email layout (`wrapEmailHtml` / template vars `{{contactEmail}}`) therefore shows the correct address.
- Additive migration under `supabase/migrations/` (pattern of `163_mimundo_contact_email.sql`); apply to Mozarthitos tenant DB.
- Vitest (or existing brand/theme merge coverage) locks that mozarthitos override wins over the Golden default when present.

**Out of scope:**
- Changing Golden English `SYSTEM_PROPERTIES_DEFAULTS` (`crisins@hotmail.com` stays the shared fallback).
- Rewriting historical migrations `094` / `096` (they seeded `info@mozarthitos.cl`; new additive migration supersedes for prod).
- CMS UI redesign; ops can still edit contact via Site Setup / theme properties after the backfill.

## Root cause (verified on Mozarthitos Supabase)

Email templates do **not** hardcode the address. They use brand contact from effective theme properties:

`SYSTEM_PROPERTIES_DEFAULTS["contact.email"]` = `crisins@hotmail.com`  
→ overlaid with **active** `site_themes.properties`.

Live state:

| slug | is_active | `contact.email` |
|------|-----------|-----------------|
| `mozarthitos` | **true** | **missing** |
| `default` | false | `mozarthitos@gmail.com` |

Because the active row lacks `contact.email`, merge falls back to Golden’s default → footers show `crisins@hotmail.com`. The correct Gmail lives only on the inactive `default` theme (likely an earlier Site Setup save on that row).

## Decision

1. **Migration `170_mozarthitos_contact_email.sql`** — `UPDATE site_themes SET properties = properties || jsonb_build_object(...)` for `slug = 'mozarthitos'`:
   - `contact.email` → `mozarthitos@gmail.com`
   - also merge `contact.phone` / `social.instagram` from the known Mozarthitos values if we want parity with the inactive `default` row (phone `+56 9 5991 6314`, Instagram URL already used in seeds).
2. **Do not** change code paths in `wrapEmailHtml` — they are correct; this is data/theme drift.
3. Optional ops note: after migrate, restart / refresh; confirm Communications → email template preview.

## Risks

- Wrong email string in migration → wrong footer until another migration/CMS edit. Mitigate: use the value already present on `default` (`mozarthitos@gmail.com`) per product ask.
- Shared Supabase with multiple themes: `WHERE slug = 'mozarthitos'` keeps blast radius narrow.

## Manual QA (user)

- On `dev:mozarthitos`, open admin Communications email template preview / send a test: footer contact = `mozarthitos@gmail.com`.
- Landing/footer contact matches the same address.
