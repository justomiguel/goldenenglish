# CentroListo home offer

Spec: `docs/superpowers/specs/2026-10-29-centrolisto-home-offer-design.md`

1. Add `pickHomeClientPreviews` and cover it in `centrolistoClientPreviews.test.ts`.
2. Add home copy in `en.json`, `es.json`, and `pt.json`.
3. Split the home into hero, proof, start, and FAQ pieces. Update the chronicle so the film is first and fades.
4. Load public clients on the home page and pass the two featured rows.
5. Add the fixed WhatsApp control on `PulsarSiteChrome`.
6. Update `PulsarLandingPages.test.tsx` for the new order, the offer, the proof, and the free-page note.
