# Mozarthitos WhatsApp share image

**Intent:** A Mozarthitos link pasted in WhatsApp shows a solid card. The card uses a dedicated JPEG, the same way Matiss uses `public/images/matiss/ilustraciones/og.jpg`.

**Done when:**

- `og:image` for a Mozarthitos page with no page photo is `https://<host>/images/mozarthitos/og.jpg`.
- That file is a JPEG, 1200×630, sRGB, and it has no alpha.
- The header wordmark stays `public/images/mozarthitos/inicio/1.png`.
- A blog cover, an event cover, a product image, or a badge image still wins over this card.
- Matiss, Nago, Liora, Mi Mundo, Espacio Zenit, and Golden keep their current share image.

**Out of scope:**

- Do not change the landing hero, the contact FAQ, or the header logo.
- Do not draw a new face. Reuse the cartoon in `public/images/mozarthitos/logo/1.png` and the wordmark in `inicio/1.png`.
- Do not put a real child photo on the card. `inicio/banner.jpg` stays the hero only.
- Do not add a runtime `opengraph-image.tsx` slogan card.
- Do not bust the WhatsApp cache with a query string. The new path is the new URL.

## Cause

`loadHomeSharePhotoUrl` picks landing slot `inicio` / `1.png`.

For Mozarthitos that file is the wordmark: PNG, alpha, 1024×303. The letters are white. WhatsApp paints the card on white. The letters disappear. The ratio is also far from 1.91:1.

Matiss does not use that slot as a logo. `matissSectionImageSrc` maps `inicio` position 1 to `ilustraciones/og.jpg` (opaque JPEG, 1200×675). The page hero is another slot.

Mozarthitos cannot reuse that slot map. The header, the contact screen, and the register screen read `inicio` / `1.png` as the wordmark (`logoWidth` 1024, `logoHeight` 303).

## Decision

Add `public/images/mozarthitos/og.jpg`.

Compose it from files and copy that already exist:

1. Fill the canvas with the Mozarthitos yellow `#f3c94e`.
2. Place the cartoon from `logo/1.png` on a white disc. Keep the whole figure. Do not crop the violin. Do not draw a new face.
3. Place the wordmark from `inicio/1.png` on a band of `#c41e3a` so the white letters stay readable. That image is the brand. It already includes "REVOLUCIÓN AUDITIVA".
4. Set the hero phrase under the brand, in Baloo 2: "Primera Academia en Chile y Sudamérica" and "con alfabetización sonora". Use those sentences. Do not write "escuela".
5. Export JPEG. No alpha.

`mozarthitosSectionImageSrc` returns `/images/mozarthitos/og.jpg` when the section is `inicio` and the filename is `og.jpg`. The `1.png` path stays the wordmark.

`loadHomeSharePhotoUrl` asks for `inicio` / `og.jpg` with no media map. Use that URL only when both are true:

- The resolved path is not the same path as `inicio` / `1.png`.
- A HEAD request returns 200.

Then that URL wins over the CMS `inicio` slot and over the logo. Matiss resolves `og.jpg` and `1.png` to the same file, so Matiss stays on the current chain. Other themes resolve `og.jpg` to a file that is not on disk. The HEAD fails and the current chain runs.

## Surfaces (Web vs PWA)

This change is the share card only. No screen layout changes.

Public pages are Tier A. Web and PWA read the same `og:image` from `buildResolvedPublicShareMetadata`. No `src/components/pwa/` tree changes. The header logo prop stays the wordmark on both surfaces.

## Tests

- `mozarthitosSectionImageSrc("inicio", "og.jpg")` is `/images/mozarthitos/og.jpg`.
- `mozarthitosSectionImageSrc("inicio", "1.png")` stays `/images/mozarthitos/inicio/1.png`.
- `pickHomeSharePhotoUrl` (or the loader helper) prefers the dedicated file when the path differs and the file exists.
- A page image still wins in `pickShareImageUrl`.
- A theme whose `og.jpg` path equals `1.png` does not skip the media map.

## Manual QA (user)

Paste the Mozarthitos home URL into WhatsApp after deploy. The card shows the yellow JPEG. The old blank card can stay in an already-opened chat until WhatsApp fetches the new URL.
