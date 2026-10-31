# CentroListo creative redesign v2

Status: approved in chat on 2026-10-30. The user asked to implement this brief on the existing commercial site, without a design-stop.

## Intent

Make Presencia, Gestión, and Ecosistema three distinct offers on the CentroListo home, in the main nav, and on their own pages. Cut home copy. Add a visual protagonist per section. Add intentional motion. Keep every testimonial and client logo.

## Done when

- Home order: hero, clients, three large product panels, scroll story, benefits, identity, all six testimonials, three start steps, closing image.
- Routes `/{locale}/soluciones/presencia|gestion|ecosistema` exist only on the platform host.
- Desktop nav shows the three product names. The PWA keeps four tabs. Product links sit above the segment list on the narrow chrome.
- Motion is CSS plus a small in-view helper. No new animation library. `prefers-reduced-motion` disables decorative motion. Clicks stay available during the hero sequence.
- Editorial photos, when generated, are atmosphere. They are not labeled as CentroListo clients. Product frames use existing site captures and product recordings only.
- Spanish stays neutral tuteo. No prices, no invented metrics, no fake product screenshots.

## Out of scope

- Auth, billing, provisioning, and database.
- A fifth PWA tab.
- Argentine voseo.
- Anonymous analytics ingest.
- Subscription plans or prices.

## Surfaces

Tier B marketing site. Desktop chrome and the existing PWA chrome both stay. New sections render inside `PulsarSiteChromeEntry`. The narrow chrome does not gain a tab. Solution links are in the desktop header and in the block under the PWA main content.

## Preservation

- Six testimonials stay on the home and on `/clientes`, with the same name, role, quote, and photo.
- Client logos and the two live preview cards stay.
- The competitor comparison stays on `/producto` and moves to the Gestión page.
- The home FAQ moves to the Gestión page.
- The twelve product modules stay on `/producto`.
