# Nagô en acción — replace the four photos

**Intent:** Replace the four photos in the landing strip "Nagô en acción" with four real event photos from the set the user sent.
**Done when:** `LandingNagoAccion` shows these four files, in this order, and no longer shows `nago-gal-01.png` through `nago-gal-04.png`.
**Out of scope:** The gallery below, hero, programs, Mestre photo, copy, and alt text.

## Surfaces (Web vs PWA)

Tier A public landing. One shared organism, `LandingNagoAccion`. No separate PWA tree. The same four files serve `web-desktop`, `web-mobile`, and `pwa-mobile`. The frame stays `aspect-[16/10]` with `object-cover`.

## Choice

The strip is wide. Portrait shots lose the subject. These four are the clearest photos and already read as action:

| Order | File | Scene |
|---|---|---|
| 1 | `nago-accion-01.jpg` | Jogo in the gym, atabaque and berimbau in the circle |
| 2 | `nago-accion-02.jpg` | Children moving on the mat under the Nagô banner |
| 3 | `nago-accion-03.jpg` | Street roda with berimbaus and atabaque |
| 4 | `nago-accion-04.jpg` | Full group on stage under the Nagô banner |

Each file is cropped to 16:10 before it is saved, so `object-cover` does not cut faces. The foreground head in the jogo photo is outside the crop.

## Risks

A same URL can stay in a browser cache. These are new filenames, so the first load fetches them. The gallery still uses `nago-gal-0*.png`.
