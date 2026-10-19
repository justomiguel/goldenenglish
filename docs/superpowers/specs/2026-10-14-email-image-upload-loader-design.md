# Email image upload loader

**Intent:** While an email image is uploading, show the same blocking loader the product already uses for file uploads: spinner, phase label, and progress.

**Done when:** Choosing a PNG, JPEG, or WebP opens that loader with “Preparando la imagen…” and then “Subiendo la imagen…” plus the percent. The loader stays until the image is inserted or the error appears. The toolbar stays disabled during the upload. A test shows the sending label while the upload is still pending.

**Out of scope:** Video links, the 10 MB cap, and loaders on other upload screens.
