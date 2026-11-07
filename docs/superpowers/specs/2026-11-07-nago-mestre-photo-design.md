# Nagô — replace Mestre Fagulha photo

**Intent:** Replace the landing photo of Mestre Fagulha with the studio portrait the user attached.
**Done when:** `public/images/nago/template/nago-mestre.png` is that portrait. The landing section still loads `NAGO_TEMPLATE.mestre`. The face stays inside the portrait crop on web and on a narrow viewport.
**Out of scope:** Copy, stats, other Nagô photos, alt text, and a new filename.

## Surfaces (Web vs PWA)

Tier A public landing. One shared organism, `LandingNagoMestre`. No separate PWA tree. The same file serves `web-desktop`, `web-mobile`, and `pwa-mobile`. The frame stays `aspect-[3/4]` and `md:aspect-[4/5]` with `object-cover`.

## Asset

| | Current | New |
|---|---|---|
| Path | `public/images/nago/template/nago-mestre.png` | same path |
| Size | PNG 1024×1536 | JPEG 1024×1024, written back as PNG |

The square photo is wider than the frame. `object-cover` crops the sides. The face sits near the horizontal center, so `object-[center_20%]` still keeps the head. No component change unless the crop cuts the face.

## Risks

A same URL can stay in a browser cache. A hard refresh shows the new file. Do not change the public path.
