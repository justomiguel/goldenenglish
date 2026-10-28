# CentroListo.cl — Playwright Flow Videos & Showcase Player Plan

**Spec:** `docs/superpowers/specs/2026-10-28-centrolisto-playwright-flow-videos-design.md`

## Steps

1. **Red test (`src/__tests__/components/organisms/pulsar/PulsarLandingPages.test.tsx`)**
   - Assert `PulsarLandingHome` renders the video player for the default tab (`/videos/centrolisto/public-web-desktop.webm`), switches to `/videos/centrolisto/public-web-mobile.webm` when clicking the mobile surface toggle, and switches to `/videos/centrolisto/admin-director-mobile.webm` when selecting the second portal tab.
2. **Dictionaries (`src/dictionaries/{es,en,pt}.json`)**
   - Add `videoSurfaceDesktop` and `videoSurfaceMobile` to `dict.pulsar.home.portals`.
3. **Showcase Component (`src/components/organisms/pulsar/PulsarInteractivePortalShowcase.tsx`)**
   - Add Desktop (`Monitor`) / Mobile (`Smartphone`) toggle and `<video>` preview frame with warm, tactile styling (rule `44-no-ai-slop-design.mdc`).
4. **Playwright Video Generator (`scripts/record-centrolisto-flow-videos.mjs` + `package.json`)**
   - Implement the Playwright recorder script that launches headless Chromium with `recordVideo`, renders the 4 flows in both Desktop (1280×720) and Mobile PWA (390×780) viewports, animates cursor movements, clicks, and typing, and outputs all 8 `.webm` files to `public/videos/centrolisto/`.
5. **Run & Verify**
   - Execute `node scripts/record-centrolisto-flow-videos.mjs` to generate all 8 `.webm` videos.
   - Run Vitest on `PulsarLandingPages.test.tsx` and related Pulsar tests.
