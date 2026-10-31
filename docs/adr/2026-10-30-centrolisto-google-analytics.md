# Centro Listo Google Analytics 4

## Context

The Centro Listo marketing site has no visit log. Institute `user_events` need a signed-in session, so they miss anonymous visitors. Staff need pages and clicks for centrolisto.cl.

## Decision

Load GA4 only on the Pulsar host when `NEXT_PUBLIC_CENTROLISTO_GA_MEASUREMENT_ID` is set. Send `page_view`, `cl_click`, and `cl_contact_submit`. Do not send names, emails, or phones. Skip `/admin`.

## Options considered

Reuse `user_events` for anonymous hits. Rejected. That table is for signed-in product use, and it does not give the GA reports staff already know.

## Consequences

- The measurement ID is public. It belongs in the Centro Listo Vercel project and in local env. It is not a secret.
- GA shows anonymous users, source, device, pages, and events. It does not show a person's name.
- Vitest covers the ID check, the admin skip, and the click payload.
