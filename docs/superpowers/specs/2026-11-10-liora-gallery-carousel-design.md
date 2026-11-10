# Liora gallery — moving strip

**Status:** approved 2026-11-10.

## Intent

The Liora gallery section shows three still frames. A visitor reads that as the whole gallery. Replace those three frames with a strip that advances through every photo and video poster.

## Done when

- The strip lists all 21 catalog items, in catalog order. Photos use the photo. Videos use the poster and the play icon.
- Wide layout shows three frames. Narrow layout shows one frame. A sliver of the next frame stays visible.
- The strip advances one frame every 4 seconds.
- Hover, keyboard focus inside the strip, and `prefers-reduced-motion: reduce` stop the advance.
- A pause control stops and resumes the advance. The label comes from the dictionary.
- A click on a frame opens the existing modal on that item. A video still plays in the modal. A photo slide still has no `video` element.
- Previous and next controls stay. Each target is at least 44 px.
- The position line uses the existing `carouselPosition` string and the full count.
- `LioraLandingGallery.tsx` stays under 250 lines. The timer lives in its own hook.
- Vitest fakes the timer. One test sees the visible frame change. One test sees no change under reduced motion.

## Out of scope

- New photos or videos.
- Autoplay of the video file inside the strip. The strip shows the poster.
- Hero, class cards, sede flyers, and the logo.
- A PWA fork. This landing has no `src/components/pwa` tree. The same component serves the wide and narrow layouts.
- A new analytics event.
- Push or deploy.

## Surfaces (Web vs PWA)

Tier A public landing. No `useAppSurface` split and no PWA tree. Do not add one.

- Wide: three frames in a row, plus a sliver of the next frame.
- Narrow: one frame, plus a sliver of the next frame. Controls stay at least 44 px. The existing safe-area padding stays.

## Copy

Add `autoplayPause` and `autoplayPlay` in `en.json`, `es.json`, and `pt.json`.

- en: `Pause gallery` / `Play gallery`
- es: `Pausar galería` / `Reproducir galería`
- pt: `Pausar galeria` / `Reproduzir galeria`

Spanish stays neutral tuteo. Reuse `carouselPrev`, `carouselNext`, and `carouselPosition`.
