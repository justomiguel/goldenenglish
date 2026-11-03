# Empezar gratis with an existing login

**Intent:** A signed-in person who clicks Empezar gratis opens the free-page form. The account can be any Pulsar login. A signed-out person still opens the register form.

**Done when:**

- The header and the pricing close link use `/cuenta/nuevo` when `email` is set.
- The same links use `/cuenta/registro` when `email` is empty.
- `/cuenta/registro` sends a signed-in person to `/cuenta/nuevo`.
- `/cuenta/nuevo` shows the create form for a missing, pending, or approved owner who is under the free-site limit.
- A login with no owner row gets an approved `platform_owners` row, then the form.
- A rejected owner, or an owner at the free-site limit, stays on `/cuenta`.
- Web chrome and the PWA thumb link use the same path.

**Out of scope:** New signup still waits for staff approval. Billing. A fourth free site.

## Surfaces (Web vs PWA)

Tier B marketing chrome. `PulsarSiteChrome` is web-desktop. `PulsarSiteChromePwa` is the narrow tree. Both change the Empezar gratis href. Account screens stay Tier B and have no second PWA tree. The account shell shows the logo and the tagline on every account page. The create form shows a real screenshot of each template page. On hover, the card offers a larger preview and three colors: main, accent, and background. The larger preview uses those colors. Opening the site saves them on the template. A blank domain uses a CentroListo host. Account pages stay `noindex` and still send a brand card plus a WebPage description.
