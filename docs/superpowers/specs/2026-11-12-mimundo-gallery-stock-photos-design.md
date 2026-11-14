# Mi Mundo gallery — drop stock photos 4–8

**Intent:** The public Mi Mundo gallery lists eight files. Photos 1–3 are the school. Photos 4–8 are stock images. Remove 4–8 from the gallery and from `public/`.

**Done when:**

- `MIMUNDO_GALLERY_FILENAMES` lists only `galeria-1.jpg`, `galeria-2.jpg`, and `galeria-3.jpg`.
- Files `public/images/mimundo/galeria/galeria-4.jpg` through `galeria-8.jpg` are gone.
- The carousel on the public landing (`#galeria`, visitor with no profile) shows three photos.
- The existing gallery URL test still passes against the shorter list.

**Out of scope:** Other Mi Mundo sections. CMS uploads. Matiss gallery.

## Surfaces (Web vs PWA)

Public marketing landing. Tier A. One shared organism, `MiMundoLandingGallery`, used by `LandingMimundoSections`. No separate PWA gallery tree. The list lives in `src/lib/landing/mimundoGalleryImages.ts`. Both widths read that list. This change does not alter layout, props, or hooks.

## Root cause

`MIMUNDO_GALLERY_FILENAMES` hard-codes `galeria-1.jpg` … `galeria-8.jpg`. The component previews the first three and opens the rest in the carousel. Files 4–8 are stock photos, not school photos.
