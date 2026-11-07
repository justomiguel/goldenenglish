# CentroListo current menu item shade

## Intent

The CentroListo menu marks the page you are on with a shaded item.

## Done when

- Desktop header: the link whose key matches `activeNav` has `aria-current="page"` and a muted background.
- Other desktop header links stay unshaded.
- PWA bottom nav: the current tab keeps `aria-current="page"` and gains the same muted background.
- Footer links stay unshaded.

## Out of scope

- Scroll spy. The shade follows the page, not the scroll position.
- Three-column solution comparison.
- Segment pages. They still mark Inicio.

## Surfaces (Web vs PWA)

Tier A public marketing. `PulsarSiteChromeEntry` already splits the trees.

- Web (`web-desktop`): shade the matching item in `PulsarSiteChrome`.
- PWA (`web-mobile` / `pwa-mobile`): shade the matching tab in `PulsarSiteChromePwa`. Shared `activeNav` stays the same prop.
