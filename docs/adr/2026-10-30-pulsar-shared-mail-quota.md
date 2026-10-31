# Pulsar shared mail quota

## Context

A new institute often has no Resend account. Outbound mail then has no key. Pulsar already stores a platform Resend key for its own notices.

## Decision

If the institute `resend_api_key` is empty, send with the Pulsar Resend key and the Pulsar from-address. Count each successful send on `platform_tenants.pulsar_mail_sent`. Stop at `pulsar_mail_quota`. The default quota is 50. Staff change it in the Pulsar tenant form. An institute key skips this path.

## Options considered

Use `RESEND_API_KEY` from the app env for every institute. Rejected. That key is not the Pulsar account, and multi-tenant mode already ignores it so one env key cannot serve every institute.

## Consequences

- Control-plane migration `010_tenant_pulsar_mail_quota.sql`.
- A failed send releases the reserved slot.
- The counter does not reset by itself. Staff raise the quota to allow more mail.
- Vitest covers the account choice, the quota block, and the form default.
