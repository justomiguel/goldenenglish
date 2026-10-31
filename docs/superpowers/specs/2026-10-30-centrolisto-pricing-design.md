# CentroListo pricing presentation

**Intent:** Show three commercial offers on the CentroListo marketing site. Presencia is free with a ready-made template. A custom design is a separate quote. Gestión is CLP 29.990 + VAT per month. Ecosistema is CLP 69.990 + VAT per month. Amounts live in one module. Billing, subscriptions, and contracts stay unchanged.

**Done when:**

- Home, `/precios`, and each solution page show the same Chile prices from `src/lib/pulsar/centrolistoCommercialOffer.ts`.
- Presencia says it is free with a ready-made template, keeps the real free-site limits, and links custom design to `/contacto`.
- Gestión and Ecosistema CTAs open `/contacto`. Presencia’s create CTA opens `/cuenta/registro`.
- `/precios` includes the three offers, the template rule, setup fees, a feature comparison, FAQ, and a final CTA.
- The desktop header and the PWA content links include Precios. The header and the PWA thumb say “Empezar gratis” and open registration. The PWA tab bar stays at four tabs.
- Argentina amounts and the 120/300 student caps stay in the config with status `pending` and are not rendered.
- Spanish copy uses tuteo. The single `es` locale does not gain voseo.

**Out of scope:** Charging, plan enforcement, checkout, a second locale for Argentina, publishing unvalidated student caps.

## Surfaces (Web vs PWA)

Tier B marketing. Desktop header gains Precios and changes the corner CTA to registration. PWA keeps four tabs. Precios sits with the solution links under the page content. The thumb CTA opens registration. Shared solution data does not change admin screens.

## Published Chile offer

| Offer | Amount | Status |
|---|---|---|
| Presencia monthly | 0, template only | published |
| Gestión monthly | 29990 CLP + VAT | published |
| Ecosistema monthly | 69990 CLP + VAT | published |
| Presencia self-serve setup | 0 | published |
| Presencia custom design | quote | published |
| Gestión self-serve setup | 0 | published |
| Gestión assisted setup | 49990 CLP + VAT, once | published |
| Ecosistema assisted setup | 149990 CLP + VAT, once | published |
| Special integrations | quote | published |
| Argentina monthly amounts | 44900 / 99900 ARS | pending, not rendered |
| Active-student caps 120 / 300 | proposal | pending, not rendered |

Gateway fees stay a FAQ sentence. No rate is invented.
