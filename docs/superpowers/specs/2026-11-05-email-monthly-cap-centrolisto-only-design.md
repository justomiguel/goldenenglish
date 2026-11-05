# Monthly mail cap — read it from Resend

**Intent:** Institute staff see the monthly mail number. They cannot change it. CentroListo staff see the same kind of number next to each institute. The number comes from that institute's Resend key.

**Done when:**

- The institute email settings screen shows the number as text. It has no input and no save control for that number.
- `setEmailMonthlyCapAction` rejects every caller.
- The CentroListo fleet table has a read-only column. Each row shows that institute's monthly mail count.
- A row with `resend_api_key` calls `GET https://api.resend.com/usage` and shows `emails.monthly.used / emails.monthly.limit`.
- A row with no key shows the Pulsar allowance (`pulsar_mail_sent / pulsar_mail_quota`).
- A key that cannot report usage shows a short unread line. The screen does not invent a number.
- The API key stays on the server. The browser receives only the counts.
- Copy in `en.json`, `es.json`, and `pt.json` matches both screens.
- Tests cover the usage parser, the institute read-only screen, the rejected action, and the fleet column.

**Out of scope:** Editing `pulsar_mail_quota`. Changing the send gate that reads `site_settings.email_monthly_cap`.

## Surfaces (Web vs PWA)

Institute email settings is Tier B. `EmailSendsAdminSettingsForm` has no PWA tree. The read-only number stays on that desktop form.

The CentroListo fleet table is one shared table inside `PulsarPanelFrame`. Desktop and narrow chrome already wrap that table. Add the column once. Do not add a second tree.

## Decision

Read the Resend Usage API with the institute key on the server. Full-access keys return the monthly quota. Sending-only keys return 401. Show that as unread. Institutes with no key keep the Pulsar allowance as the visible number.

## ADR

`docs/adr/2026-11-05-email-monthly-cap-centrolisto-only.md`
