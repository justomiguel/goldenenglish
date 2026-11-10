# Plan — Liora redesign

Spec: `docs/superpowers/specs/2026-11-10-liora-redesign-design.md`.

## Steps

1. **Tokens and type.**
   - Write `lioraPalette.test.ts` first. Then change the tokens in `lioraLanding.css`.
   - In `LioraFontRoot`, change Cormorant to Playfair and add Allura.
2. **Lockup and header.**
   - Write tests first for `LioraDancerMark`, `LioraLockup`, and `LioraSiteHeader`.
   - Drop `logoSrc` and update every caller.
3. **Ribbon.**
   - Write `lioraRibbonPath.test.ts` and pure `lioraRibbonPath.ts`.
   - Build `LioraDancerPose` and its test, then `useLioraRibbon`.
   - Build `LioraRibbonOverlay` and its test. Put the styles in `lioraRibbon.css`.
4. **Sections.**
   - Build the `LioraSectionHeading` molecule (title, script word, heart rule, lead).
   - Split the hero and sobre out of `LandingLioraSections`.
   - Restyle Clases, Sedes, Horarios, Galería, CTA, and the footer.
   - Add `data-liora-side` anchors for the ribbon.
5. **Copy.**
   - Dictionaries en, es, and pt: `chrome.motto`, `*.titleScript`, and shorter titles.
   - Drop the section kickers except `hero.kicker`. Update `landingLioraCatalog`.
6. **Verify.** Run the targeted Vitest files, then lint, `tsc`, and `next build`.
7. **Ship.** Write changelog `024`, apply it to Pulsar, and commit the spec, plan, and code together.
