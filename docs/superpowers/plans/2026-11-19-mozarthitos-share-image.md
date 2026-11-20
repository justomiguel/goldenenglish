# Mozarthitos share image

Spec: `docs/superpowers/specs/2026-11-19-mozarthitos-share-image-design.md`

1. Test `mozarthitosSectionImageSrc("inicio", "og.jpg")` and keep `1.png` as the wordmark.
2. Test `bundledDedicatedSharePath`: a different path wins. The same path as slot 1 does not.
3. Map `og.jpg` in `mozarthitosLandingImages.ts`.
4. `loadHomeSharePhotoUrl` returns that file when the path differs and HEAD is 200.
5. Build `public/images/mozarthitos/og.jpg` at 1200×630 from the cartoon, the wordmark, and the hero phrase.
6. Add the changelog row `mozarthitos-share-image`.
