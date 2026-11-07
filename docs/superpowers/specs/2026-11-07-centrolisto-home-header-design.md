# CentroListo home CTA and header

**Intent:** The CentroListo home keeps one hero action, "Crear mi página gratis". The header stays on one line. Country flags stay visible on the home.

**Done when:**

- The home hero and the closing block do not render "Explorar la plataforma" or a demo request.
- "Crear mi página gratis" is the only action in those two blocks, and it links to `/{locale}/cuenta/registro`.
- Desktop header links sit on one row. They scroll inside the row when the width is tight.
- Chile, Argentina, Uruguay, and Paraguay appear as flag controls in the header on desktop and on the PWA tree. The active country stays marked. Choosing a flag still sets `pais` and the market cookie.

**Out of scope:** Other pages' demo links (Producto, Clientes, solution landings). Footer link lists. Institute landings.

## Surfaces (Web vs PWA)

Tier A public marketing. `PulsarSiteChromeEntry` already splits desktop and PWA.

- Web: one header row. Logo, nav, flags, session, start-free.
- PWA: same flag control replaces the country select in the top bar. Bottom nav stays. The hero CTA is the shared `PulsarHomeHero`.
