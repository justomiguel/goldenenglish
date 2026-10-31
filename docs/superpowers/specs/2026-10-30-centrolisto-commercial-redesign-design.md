# CentroListo commercial redesign

Status: approved in chat on 2026-10-30. The user asked to implement the commercial redesign on the existing site, without a second confirmation stop.

## Intent

Make the CentroListo public site (platform host) explain a full institution platform, keep every current testimonial and client, and send visitors to the real demo conversation or the real free-page registration.

## Done when

- The home follows the commercial sequence: trust, problem, benefits, platform, offering, identity, all six testimonials, how it starts, preserved comparison, and a closing call to action.
- Hero and closing buttons open `/contacto` or `/cuenta/registro`.
- Free registration copy states the public page, the admin review, the limit of three sites, and that students and tuition are not included.
- Segment pages exist for dance, music, languages, sports, and events. Copy only claims features already described in the product page.
- Spanish stays neutral Latin American tuteo. The product has one `es` locale. Argentine voseo is out of scope because `neutralSpanishCopy` forbids it.
- Home title and description match the requested SEO strings.
- No backend, billing, auth, or database change.
- No invented prices, ratings, testimonials, or logos.

## Out of scope

- New payment providers, plans, or prices.
- A public analytics ingest. `user_events` requires a signed-in user, so anonymous marketing clicks are not sent there.
- Rebuilding the product, client, or contact pages from zero.
- PWA tab count stays four. Segment links live in the footer and on the home.

## Surfaces

Tier B marketing site for directors. Desktop chrome and the existing PWA chrome both stay. New sections are shared content inside `PulsarSiteChromeEntry`. Segment links are added to both chromes. No new mobile-only tree.

## Preservation

- Six testimonials in `pulsar.clients.voices`. Same name, role, and quote. Photos stay on `/centrolisto/voices/`.
- Client logos and live previews stay. The home shows every loaded client mark, and the two preview cards stay.
- The competitor comparison stays on the home and on `/producto`.
- The twelve product modules stay on `/producto`.
