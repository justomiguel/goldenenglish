# Centro Listo Google Analytics 4

## Context

The Centro Listo marketing site has no visit log. Institute `user_events` need a signed-in session, so they miss anonymous visitors. Staff need pages and clicks for centrolisto.cl.

## Decision

Load GA4 only on the Pulsar host when `platform_settings.ga_measurement_id` is set. Staff save that id in Pulsar admin. Send `page_view`, `cl_click`, and `cl_contact_submit`. Do not send names, emails, or phones. Skip `/admin`.

## Options considered

Reuse `user_events` for anonymous hits. Rejected. That table is for signed-in product use, and it does not give the GA reports staff already know.

## Consequences

- The measurement ID is public. It lives on `platform_settings`. A save applies on the next request. It is not a secret and it does not need a deploy.
- GA shows anonymous users, source, device, pages, and events. It does not show a person's name.
- Vitest covers the ID check, the admin skip, and the click payload.
