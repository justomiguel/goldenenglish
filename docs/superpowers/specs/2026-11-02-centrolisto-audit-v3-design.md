# CentroListo audit v3 — copy, proof, and conversion

**Intent:** Correct the live marketing site. Three products stay distinct. Prices stay the published table. Visitors see the real product before a form. Country voice stays consistent. No new backend and no new plan limits.

**Done when:**

- Chile and Paraguay stay tuteo. Argentina and Uruguay stay voseo on the marketing tree, including strings the overlay does not list.
- The home hero explores the product. A separate control requests a demo. The free-plan sentence is short and links to Presencia.
- Home, prices, and each solution show the same published amounts.
- Gestión still says 50 active students. That number is not changed.
- Argentina monthly amounts are the approved round prices: 44900 and 99900. The Argentina custom landing stays 232300.
- Real product images replace generic process photos where a real capture exists.
- The six stored testimonials stay, with the same quote, name, and role.
- Contact claims that lack an operational guarantee use conditional wording.
- A product CTA can preselect the commercial interest. The existing contact send path stays.

**Out of scope:** New Argentina prices. A 120-student Gestión cap. Backend plan enforcement. AI-generated product screens. Removing `/producto` comparison in this pass. Institute dashboards.

## Surfaces (Web vs PWA)

Marketing chrome already splits. `PulsarSiteChromeEntry` renders desktop `PulsarSiteChrome` and narrow `PulsarSiteChromePwa`. Both receive the same merged dictionary.

- **Web:** hero depth, sticky story, and product frames use pointer and scroll. Targets stay at least 44px.
- **PWA / narrow:** the same sections stack. No sticky scroll trap. Motion is opacity and transform only. `prefers-reduced-motion` disables entrance motion.
- Admin fleet screens stay on the base dictionary.

## Decisions

1. Country voice is applied once in `applyCentrolistoMarketDictionary`. Components do not branch on country for verbs.
2. Published prices stay in `centrolistoCommercialOffer.ts`. They are manual amounts, not a live exchange rate.
3. The Gestión student cap of 50 is copy only. Section `max_students` is a per-section seat count. No subscription enforcer reads 50. Do not change the sentence until a commercial decision.
4. Product images in this pass are files already in the repo: `public/centrolisto/product/*`, template photos under `public/generic/*/inicio.jpg`, and the existing product video. Two captures are different institutions. Captions say they are real product surfaces. They are not presented as one school.
5. Competitor comparison leaves the Gestión landing. It remains on `/producto` until that page is edited in a later pass.
6. Interest is prepended to the contact message. The subject enum and the send action stay.

## Pending commercial decisions

Approved on 2026-11-02. Gestión publishes 120 active students. That number is commercial copy. The database does not enforce it. Argentina Gestión is 44900 ARS per month. Argentina Ecosistema is 99900 ARS per month. Uruguay and Paraguay stay on the previous manual table. The Argentina custom landing stays 232300 ARS.

| Topic | Published now |
|---|---|
| Gestión student cap | 120 active students, copy only |
| Argentina Gestión | AR$44.900 / month |
| Argentina Ecosistema | AR$99.900 / month |
| Argentina custom landing | AR$232.300, one time |
| Uruguay and Paraguay | Unchanged manual table |
| Competitor matrix on `/producto` | Removed |
| Day-one domain and week-one payments | Conditional wording |
| Isolated database as a legal certification | Not claimed |

## Testimonials

Six voices stay in `dict.pulsar.clients.voices`: Camila, Mateo, Andrea, Rodrigo, Sofía, Luis. The repo stores quote, role, and portrait. It does not store a release or a source note. Treat all six as pending authenticity review. Do not delete them. Do not add new quotes.

## Surfaces checklist

- [x] Web and PWA share the dictionary and the chrome entry.
- [x] Narrow layout does not depend on a sticky desktop story.
- [x] Existing PWA chrome tests stay valid because chrome props are unchanged.
