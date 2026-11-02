# CentroListo copy by country

**Goal:** Marketing Spanish follows the price country. Argentina and Uruguay use voseo. Chile and Paraguay keep tuteo.

**Architecture:** `es.json` stays the full Spanish source. `src/dictionaries/pulsar/es-ar.json` overrides second-person marketing lines. Uruguay starts from that voice, then `es-uy.json`. Chile and Paraguay use `es-cl.json` and `es-py.json`, empty until a line must name the country. Prices stay in the offer table.

**Tech Stack:** Next.js, Vitest, dictionary JSON.

## Tasks

- [x] Pure merge: a present key replaces the base. `null` in an array keeps the base item.
- [x] Argentina and Uruguay overlays use voseo. Chile and Paraguay stay tuteo. English ignores the overlay.
- [x] Public CentroListo pages, including metadata and account pages, load the merged dictionary. Admin does not.
- [x] Rule 40 names the CentroListo exception. `es.json` still rejects voseo.
