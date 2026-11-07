# Nagô gallery by event

**Intent:** The Nagô landing gallery shows real event photos and videos, grouped by event.
**Done when:** The page shows each event as its own group: the name, 3 photos, and a video strip when that event has videos. A photo click opens that event’s carousel. A video click opens the centered player. The page does not list every photo. The home section “Más allá del entrenamiento” is gone. Conexión Internacional 2025 has 41 photos. Capoeira me chama 2022 has 52 photos and 34 videos named `v01`–`v34`.
**Out of scope:** Other Nagô sections (hero, programs, mestre). An admin upload screen. Deleting template files that those sections still use.

## Surfaces (Web vs PWA)

Tier A public landing. One shared organism, `NagoLandingGallery`. No separate PWA tree. The grouped page, the photo carousel, and the video player serve desktop, narrow browser, and installed PWA. Controls are at least 44px tall.

## Behavior

1. The page lists one group per event. Each group shows the event name, the first 3 photos, and, when the event has videos, a separate video strip. The page does not scroll through every photo.
2. If the event has videos, a separate strip under the photos shows the first 3 posters and the heading Videos. The strip is not inside the photo grid.
3. A click on a photo opens that event’s photo carousel. A click on a video opens that event’s player. The groups stay on the page.
4. The player is centered. It shows play, the downloaded buffer, and the position. An image uses `next/image`. A video uses `<video playsInline>` without the browser control bar.

## Files

- Photos: `public/images/nago/galeria/conexion-internacional-2025/01.jpg` … `41.jpg`, and `capoeira-me-chama-2022/01.jpg` … `52.jpg`.
- Videos: `public/images/nago/galeria/capoeira-me-chama-2022/v01.mp4` … `v34.mp4`, with posters `v01.jpg` … `v34.jpg`.
- Catalog: `src/lib/landing/nagoGalleryCatalog.ts` and `nagoGalleryCapoeiraVideos.ts`.
- Copy: `galeria.all`, `galeria.filterLabel`, `galeria.events.conexionInternacional2025` in `en.json`, `es.json`, and `pt.json`. The event title stays Conexión Internacional 2025 in every locale.

## Risks

The home URL gains `?evento=` only after a person picks an event. Template images stay on disk because other sections still reference them.
