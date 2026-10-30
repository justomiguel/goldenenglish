# Pulsar self-service sites

**Intent:** A person registers on Pulsar, creates up to 3 free sites, and edits each site: landing text, section photos, section visibility, contact, SEO text, and the favicon. A free site can add one custom domain. That host is sent to Vercel. Staff keep the full tenant form.

**Done when:**

- `/[locale]/cuenta/registro` creates a Pulsar auth user and a `platform_owners` row with status `pending`.
- Staff approve or reject that row from the Pulsar admin home. Only `approved` can open a site.
- Pulsar sends mail through its own Resend settings: new account, account approved, account rejected, and site created. A missing key does not block the action.
- That person sees only their sites at `/[locale]/cuenta`, with the public address and the DNS record for a custom domain. They can change that one domain later and open the theme editor.
- The account copy says this opens the public page. It does not create an institute admin for students, payments, or enrollment.
- A fourth site is rejected. A free site is `shared_schema` and a generic template. It keeps the preview host and may add one custom domain.
- Closing their site frees a slot.
- Generic landing copy keys are editable in es, en, and pt. Empty slots still use the stock photo.
- The public page hides a section listed in `app.landing.hidden`.
- The public page shows phone, email, address, and WhatsApp only when that theme row stored them.
- Home metadata uses `app.seo.title` and `app.seo.description` when the theme stored them.
- A PNG logo is scaled to 16, 32, 180, 192, and 512. Favicon mode `letter` draws the first letter of the name.
- Staff save and free-site create send each extra host to the Vercel domains API when `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` are set.
- The Pulsar admin home has three tabs: sites, accounts, and mail. The control-plane label is gone.
- Accounts lists pending, approved, and rejected owners. Pending rows can be approved or rejected.
- Mail shows whether the Resend key is saved and the last send result. A test button sends one message to the admin address and shows the Resend error on the card.
- Every Pulsar mail, including the test, uses `wrapEmailHtml` and the CentroListo logo at `/centrolisto/apple-touch-icon.png`. The logo URL uses a public platform host.
- The sites list shows the logo, the name, whether the database answers, and visits for 7 days. A logo uses a file in this app when that file exists. Otherwise it uses the theme path. A broken image falls back to the first letter. A bar chart compares those 7-day visits. Base, migration, domains, DNS, Vercel, owner, and a 14-day visit chart stay on `/[locale]/admin/tenants/[slug]`.
- That institute page shows a logo and name for each connected service: Supabase, Vercel when the site has a host, Resend, WhatsApp, Google Maps, Upstash, and Flow or Mercado Pago only when that provider is enabled. Secrets stay hidden.
- The CentroListo home shows WhatsApp, Flow, and Mercado Pago next to the week moment that already names them.

**Out of scope:** Billing, a paid plan, more than 3 free sites, creating a Supabase project, and a separate PWA tree for Pulsar account screens.

## Free plan

| Limit | Rule |
| --- | --- |
| Sites | 3 rows in `platform_tenant_owners` for that user |
| Database | `shared_schema` on the Pulsar project |
| Template | `generic-deportes`, `generic-jardin`, `generic-colegio`, `generic-musica`, `generic-idiomas` |
| Host | Preview subdomain, plus one optional custom domain. The owner can change that domain later. The account page shows the DNS record. |
| Database URL | `PULSAR_DATABASE_URL` is the session pooler (`postgres.<ref>` on `*.pooler.supabase.com`, port 5432, `sslmode=no-verify`). The direct `db.<ref>.supabase.co` host is IPv6 only. |
| Setup | `skip_initial_site_setup` is true so the public page is the landing |

Staff-created tenants have no owner row. They keep the existing form.

## Surfaces (Web vs PWA)

The public generic article stays one tree inside `LandingSurfaceGate`. Web and PWA both receive the same contact links. Those links use a 44px target. Account, theme, and the Pulsar admin home are Tier B. They have no PWA tree. The admin home uses page tabs. Forms stack on a narrow viewport and use 44px controls. Shared theme actions stay valid for the institute admin editor.

## Data

`supabase/pulsar-migrations/007_platform_owners.sql` adds `platform_owners` and `platform_tenant_owners`. `008_platform_owner_approval.sql` adds `platform_owners.status` (`pending`, `approved`, `rejected`) and Resend columns on `platform_settings` (`resend_api_key`, `resend_from_email`, `notify_email`). `009_platform_mail_status.sql` adds `mail_last_ok`, `mail_last_code`, `mail_last_detail`, and `mail_last_at`. The server uses the service role. RLS allows a user to read their own rows. There is no client insert policy. Mail uses those columns, then `PULSAR_RESEND_API_KEY` and `PULSAR_RESEND_FROM_EMAIL`. It does not use an institute Resend key. The stored detail never includes the API key.
