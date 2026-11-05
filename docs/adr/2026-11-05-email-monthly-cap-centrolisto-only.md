# Monthly mail number comes from Resend

## Context

Institute staff could type the monthly mail cap. The real quota sits on the Resend account behind each institute key. CentroListo staff need to see that quota next to each institute.

## Decision

Institute staff see the number and cannot save it. CentroListo fleet reads `GET /usage` with the stored Resend key and shows monthly used and limit. No key means the Pulsar allowance. A key that cannot read usage shows an unread line. The key never reaches the browser.

## Options considered

- Keep a typed cap on the institute form. Rejected. The institute must not set this number.
- Store a second cap on `platform_tenants`. Rejected. Resend already has the plan limit.

## Consequences

- A sending-only key cannot report the quota. The row says so.
- The existing send gate in `site_settings.email_monthly_cap` stays.
- Tests cover the parser, the read-only institute screen, and the fleet column.
