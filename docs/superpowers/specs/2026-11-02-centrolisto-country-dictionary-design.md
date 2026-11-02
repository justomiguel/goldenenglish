# CentroListo copy by country

**Intent:** CentroListo marketing Spanish follows the country already chosen for prices. Chile and Paraguay use tuteo. Argentina and Uruguay use voseo. English and Portuguese stay one file. Prices stay in the offer table.

**Done when:**

- Public CentroListo pages in `es` merge a country overlay onto `dict.pulsar` after the market is resolved (`?pais=` then cookie, else Chile).
- Chile and Paraguay read tuteo. Argentina and Uruguay read voseo for the same keys.
- A string missing from the overlay falls back to `src/dictionaries/es.json`.
- `es.json` stays free of voseo. The neutral-Spanish test still locks that file.
- Desktop and PWA receive the same merged dictionary. The country control does not change.
- English (`en`) and Portuguese (`pt`) ignore the overlay.
- CentroListo admin and every institute screen keep the base dictionary.

**Out of scope:** A new URL locale (`/es-ar`). Prices inside JSON. Live exchange rates. Institute dashboards. Email templates. Rewriting `en.json` or `pt.json` per country.

## Surfaces (Web vs PWA)

Marketing chrome already splits. `PulsarSiteChromeEntry` renders desktop `PulsarSiteChrome` and narrow `PulsarSiteChromePwa`. Both receive `dict` from the server page.

- **Web:** the page passes the merged dictionary. Header copy and price sentences use that object.
- **PWA:** the same object. No second copy file and no second merge.
- Admin fleet screens stay on the base `es` dictionary. The market cookie does not change staff copy.

## Decision

Keep the route locale as `es`, `en`, or `pt`. The country stays `cl | ar | uy | py`.

Add four overlay files:

- `src/dictionaries/pulsar/es-cl.json`
- `src/dictionaries/pulsar/es-ar.json`
- `src/dictionaries/pulsar/es-uy.json`
- `src/dictionaries/pulsar/es-py.json`

Each file is a partial `pulsar` tree. A pure merge writes only the keys present in the overlay. `es.json` remains the full Spanish source and the `Dictionary` type source.

Register:

| Country | Register | Overlay |
|---|---|---|
| Chile | tuteo | Lines that name Chile (law, currency words) when the shared sentence would be wrong elsewhere. |
| Paraguay | tuteo | Same voice as Chile. Own lines only when the sentence must name Paraguay. |
| Argentina | voseo | Second person (`tenés`, `podés`, `elegí`) on the marketing strings that address the visitor. |
| Uruguay | voseo | Same voice as Argentina unless a sentence must name Uruguay. |

`es-cl.json` can be empty at first. The base file is already tuteo. The file still exists so each country has a place to diverge.

## Prices

Amounts stay in `src/lib/pulsar/centrolistoCommercialOffer.ts`. The overlay does not store `29990` or `46400`. `Intl` still formats the amount for the country. Three languages share one table.

## Rule exception

`.cursor/rules/40-neutral-spanish-copy.mdc` still locks `es.json`, institute UI, and email templates to tuteo. Add one exception: CentroListo files `src/dictionaries/pulsar/es-ar.json` and `es-uy.json` may use voseo. The Vitest lock does not scan those two files for a ban. It does scan them to prove the Argentina overlay is not a copy of the tuteo base for at least one second-person sentence.

## Tests

- Merge: a key in the overlay replaces the base. A missing key stays the base.
- `es` + `ar` on a marketing view shows one voseo sentence and the Argentina amount.
- `es` + `cl` shows the tuteo sentence and the Chile amount.
- `en` + `ar` keeps English sentences and the Argentina amount.
- `es.json` still has no voseo token.

## Manual QA (user)

Open the CentroListo home with no `pais`. The sentences use tuteo and the prices are Chile. Choose Argentina. Reload. A second-person sentence uses voseo and the prices are Argentina. Open `/precios` and one solution page. Repeat on a narrow viewport.
