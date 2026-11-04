# Generic landing own nav

Spec: `docs/superpowers/specs/2026-11-04-generic-landing-own-nav-design.md`

1. Add `landing.genericNav` in `en.json`, `es.json`, and `pt.json`.
2. Add `GenericLandingNav` and `GenericLandingFooter`. Put `id` on inicio, each band, and contacto.
3. Remove the `/contact` link from the close. The bar action goes to `#contacto`.
4. Hide the shared header, footer, and PWA tab bar when the kind is generic. Do this on the home page and on `/plantilla/{kind}`.
5. Lock the anchors, the hidden section, and the absent login href in `LandingMainSectionsGeneric.test.tsx`.
