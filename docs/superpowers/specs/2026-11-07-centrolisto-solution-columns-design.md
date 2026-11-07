# CentroListo solution columns

## Intent

Presencia, Gestión, and Ecosistema sit side by side so a person can compare them.

## Done when

- Home (`PulsarSolutionShowcase`) and Precios (`PulsarPricingView`) render the three solutions in one `lg:grid-cols-3` list.
- Each column stacks its image, name, price, summary, lines, and action.
- The action sits at the bottom of the column.
- Narrow viewports keep one column.

## Out of scope

- The comparison table under Precios.
- Copy changes.
- The current-page menu shade.

## Surfaces (Web vs PWA)

Tier A public marketing. Both pages use `PulsarSiteChromeEntry`.

- Web (`web-desktop`, `lg` and up): three columns in one row.
- PWA and narrow web (`web-mobile` / `pwa-mobile`): one column. Shared copy, prices, and links stay the same.
