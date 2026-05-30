# ADR: Public “contact us” form → admin portal messages

## Context

Marketing sites across tenants need a single **Contact us** entry that collects name, **required email**, optional phone, subject, and message body, without requiring login. Staff must receive these as **portal messages** (same pipeline as internal messaging), one copy per admin.

`portal_messages` requires `sender_id` / `recipient_id` referencing `profiles.id` (backed by `auth.users`). Anonymous visitors have no profile.

## Decision

1. Add enum value `site_contact` on `public.user_role` (migration `118_public_site_contact_sender.sql`) and a **dedicated auth user + profile** (fixed UUID in `119_public_site_contact_sender_profile.sql`). Split because PostgreSQL requires the new enum label to be committed before use (error `55P04`). Used only as `sender_id` for these rows.
2. On submit, a **server action** validates input, builds sanitized HTML for `body_html`, and uses **`createAdminClient`** to insert one `portal_messages` row per real admin and trigger the existing staff email notification helper (same as other staff-originated mail).
3. Public UI lives at `/[locale]/contact`, themed per active `site_themes.templateKind` (classic / editorial / minimal / mozarthitos / espaciozenit / nago) reusing register-style shells.
4. Admin inbox filters include messages from `site_contact` / the fixed sender id; compose recipient list excludes that profile.
5. Admin **users directory** list + `admin_users_list_role_counts` RPC exclude `site_contact` and the fixed sender UUID (migration `136`).

## Options considered

- **New table only** — simpler schema but duplicate inbox UX and no reuse of `portal_messages` / notifications.
- **Nullable `sender_id` on `portal_messages`** — breaks FK, complicates RLS and existing policies.

## Consequences

- **Ops**: run migration `118` on every environment so the sender user exists.
- **Security**: public unauthenticated write is limited to this action; rate limiting / CAPTCHA can be added later.
- **Unidirectional**: admins see the message in the portal; replies to the synthetic sender are useless—product expectation is follow-up via the email captured on the form and optional phone when provided.

## Tests

- Pure HTML builder + delivery helper unit tests under `src/__tests__/lib/messaging/`.
