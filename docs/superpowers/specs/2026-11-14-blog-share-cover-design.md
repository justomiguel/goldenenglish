# Blog share preview uses the article photo

## Intent

A shared blog link shows the first photo of that article in the link preview.

## Done when

- The Open Graph image for a published article is that article's first photo, cropped to 1200×630.
- A relative photo path such as `/images/liora/galeria/12.jpg` is fetched as an absolute URL on the request host.
- An absolute `https` photo URL still works.
- When the article has no photo, or the fetch fails, the preview stays the home photo, then the logo.
- A test locks the relative-path case and the absolute-URL case.
- The unknown failure still logs `blog.opengraph-image.optimize` with `cover_optimize_failed`.

## Out of scope

- New photos, new articles, or a cover column backfill.
- Changing `Cache-Control` on the image response.
- Event share images.
- A deploy. The live host changes only after deploy.

## Surfaces (Web vs PWA)

Tier B metadata. The preview is one JPEG for every client. No Web layout and no PWA tree change.

## Cause

Checked on 2026-11-14 at `https://www.liorastudio.cl/es/blog/a-que-edad-empezar-ballet`.

`og:image` points at `/es/blog/a-que-edad-empezar-ballet/opengraph-image`. That URL returns HTTP 200, `image/jpeg`, 18 KB. The bytes are the LIORA logo.

The article photo is the first `<img>` in the body: `/images/liora/galeria/12.jpg`. `resolveBlogCoverImageUrl` returns that relative path. `opengraph-image.tsx` passes it to `optimizeRemoteImageForShare`, which calls `fetch`. `fetch` rejects a relative URL. The catch uses `loadHomeSharePhotoUrl`, then the brand logo.

## Plan

1. In `loadBlogArticleShareCover`, pass the cover through `toAbsoluteShareUrl` before returning `coverImageUrl`.
2. Add a self-contained test that mocks the article load. A relative body image becomes an absolute URL. An absolute body image stays absolute.
3. Leave the card renderer on the relative path. Only the share fetch needs the absolute URL.
