# Pulsar tenant create — defaults and required marks

## Intent

The staff form at `/[locale]/admin/tenants/new` asks for every integration at once. On create, fill safe defaults, mark the fields the save action requires, and group the rest as fields staff can fill later.

## Done when

- A new tenant form opens with these defaults: enabled, template `generic-idiomas`, data mode `shared_schema`, skip-wizard off, debug login off.
- Slug and visible name stay empty and show the word for required.
- Shared-database mode does not show Supabase URL, anon key, or service role key. The form does not ask for the preview domain. It shows `{slug}.{pulsar apex}` from the slug. An optional own domain stays in the later group.
- If staff switch to an own Supabase project, hosts, Supabase URL, anon key, and service role key show the required mark and block submit when empty.
- Public URL, database URL, Resend, Google Maps, VAPID, and WhatsApp sit in one closed group titled as “add later”. They are not required. Opening the group shows the fields.
- Edit keeps the saved values. The same required and later marks stay visible. The later group starts open on edit.
- Payment encryption and KV fields stay off the form on create and on edit.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish uses neutral tuteo.
- Vitest covers the create defaults, the required marks, the closed later group, and the project-mode required fields.
- A tenant with no Resend API key sends through the Pulsar Resend account.
- That path stops when the tenant reaches `pulsar_mail_quota`. The default is 50. Staff edit the number on the tenant form.
- A tenant with its own Resend API key does not use the Pulsar key and does not use the quota.
- A failed Pulsar send does not consume a slot.
- The tenant detail page shows `pulsar_mail_sent` of `pulsar_mail_quota` in the stats column.
- While a shared schema is created, the form shows which migration file is running and how many files are done.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree).

The screen is `src/app/[locale]/admin/tenants/new/page.tsx` plus `PulsarAdminTenantForm`. There is no `useAppSurface` branch and no `src/components/pwa/` twin for this form. `PulsarSiteChromePwa` is the public CentroListo chrome. This change does not touch it.

## Field rules

Required now, from `validatePulsarTenantInput`:

| Field | Create default | When it is required |
| --- | --- | --- |
| Slug | empty | always |
| Visible name | empty | always |
| Hosts | empty | own Supabase project only |
| Supabase URL, anon key, service role key | hidden | own Supabase project only |

Filled for the staff member:

| Field | Create default |
| --- | --- |
| Enabled | on |
| Template | `generic-idiomas` |
| Data mode | Base de Pulsar (`shared_schema`) |
| Skip initial site setup | off |
| Debug login | off |

Add later. The save accepts an empty value:

- Public URL
- Database URL
- Mail tenant, Resend from-address, Resend API key
- Google Maps key and map id
- VAPID public key, private key, and contact email
- WhatsApp token, phone number id, and reminder template name

Do not invent secrets, domains, or a display name from the slug.

The mail quota field stays visible on create, with 50 filled in. Resend keys stay in the later group.

## Shared Pulsar mail

`supabase/pulsar-migrations/010_tenant_pulsar_mail_quota.sql` adds `pulsar_mail_quota` (default 50) and `pulsar_mail_sent` (default 0) on `platform_tenants`. Two functions reserve and release one send. Only `service_role` can call them.

When the institute has no `resend_api_key`, outbound mail uses the Pulsar key and the Pulsar from-address (`platform_settings`, then `PULSAR_RESEND_API_KEY` and `PULSAR_RESEND_FROM_EMAIL`). The reserve runs before the send. A Resend failure releases the slot. The counter is a running total. Raising the quota allows more sends. It does not reset the counter.

A save does not write `pulsar_mail_sent`.

A new shared schema is discarded when provisioning does not finish and `platform_tenants` has no row for that schema. `DROP SCHEMA ... CASCADE` removes the partial schema, and its ledger rows go with it. A saved institute is left in place. One outer transaction cannot wrap the migration set: several files run `COMMIT`, and `ALTER TYPE ... ADD VALUE` cannot share a transaction with later use of that value.

Each migration runs with `search_path` set to the institute schema and `extensions`. `gen_random_bytes` is rewritten to `extensions.gen_random_bytes` so a column default still works after the session path changes.

The save writes `institute_migration_ledger.progress` after each file. The form polls `GET /api/admin/pulsar/schema-provision` and shows that file in the long-job dialog. The response is `Cache-Control: private, no-store`. Only Pulsar staff can read it.

## Out of scope

- Changing `validatePulsarTenantInput` or the save action.
- Showing payment encryption or KV fields.
- Provisioning Vercel, DNS, or env files.
- The public CentroListo landing and `PulsarSiteChromePwa`.
