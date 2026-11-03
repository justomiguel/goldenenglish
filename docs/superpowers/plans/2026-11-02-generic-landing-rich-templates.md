# Rich generic institute landings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-column generic landing with five compositions, extra sentences, and one-time motion.

**Architecture:** `LandingMainSectionsGeneric` picks a composition per kind and renders shared hero, day, band, and close pieces. Photos and CMS hide rules stay. Motion is a client wrapper that stays still when the user prefers reduced motion.

**Tech Stack:** Next.js App Router, React, Tailwind tokens, Vitest, dictionaries en/es/pt.

## Global Constraints

- Files stay under 250 lines.
- Colors are `var(--color-*)` or `color-mix` of those variables.
- One kicker: the scene time.
- No pills, stat cards, icon grids, or before/after boxes.
- Spanish copy is neutral tuteo.
- Hidden CMS sections stay hidden. Admin photos still replace stock.
- Public home body is shared by desktop and PWA shells. Narrow layout stacks.
- Do not edit branded landings.

---

### Task 1: Copy keys

- [ ] Extend `genericLandingCopyKeys` so `inicio` includes `rhythmA`, `rhythmB`, `rhythmC`, and each extra section includes `genericLandings.{kind}.sections.{section}`.
- [ ] Lock that in `genericSiteText.test.ts`.

### Task 2: Dictionary sentences

- [ ] Add the three rhythm lines and five section sentences to each kind in `en.json`, `es.json`, and `pt.json`.

### Task 3: Landing compositions

- [ ] Add `genericLandingComposition` and failing render tests for hero layout, rhythm text, custom hero, and a hidden section.
- [ ] Implement hero, day, bands, close, and the thin composer.
- [ ] Run `LandingMainSectionsGeneric` tests.

### Task 4: Motion

- [ ] Test that reduced motion leaves the block shown, and an offscreen block waits.
- [ ] Implement `GenericLandingMotion` and the hero scale stylesheet.

### Task 5: Screenshots

- [ ] Recapture `public/generic/{kind}/preview.jpg` from `/es/plantilla/{kind}`.
