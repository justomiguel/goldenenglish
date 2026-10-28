# Centro Listo — client landing miniatures (still + silent loop)

## Intent

`/clientes` must sell by showing each school’s public home page in motion. A director sees the real landing move (type, photo, color), not a numbered name list. Capture locally against `{slug}.localhost:3000` (example: `http://nago.localhost:3000/es`) while `npm run dev:pulsar` is running. Commit a short silent WebM plus a still poster per school. Do not record dashboards.

## Surfaces (Web vs PWA)

- **Tier B** — public platform marketing. Entry: `src/app/[locale]/clientes/page.tsx` → `PulsarClientesView`.
- No `src/components/pwa/` tree, no `useAppSurface`, no `SurfaceMountGate`.
- **Web (`web-desktop`):** two-column editorial gallery. Each card is a paper frame (hairline, warm plate, 16:10). The card plays a muted looping WebM of that home page. The whole frame is the link to the live public URL. Name and the live-site phrase sit under the frame. Do not print the host.
- **Narrow (`web-mobile`):** one column, same cards, same desktop-ratio loop (do not record a second mobile WebM per school). ≥44px tap target. No sheet.
- `prefers-reduced-motion: reduce`: show the poster only. Do not autoplay.
- Shared props: optional `previewVideoSrc` and `previewPosterSrc`. Do not change Tier A hooks.

## Approaches

1. **Committed Playwright loop + poster (chosen).** One script records ~6s of the public home and writes `{slug}.webm` + `{slug}.jpg`. The card is `<video muted loop playsInline poster>`. Fast after first load. Repeatable. Same family as the chronicle flow recorder.
2. **Still WebP only.** Cheaper repo, weaker sell. Rejected now that motion is wanted.
3. **Live `<iframe>`.** Heavy, CSP, cookies, layout shift. Rejected.
4. **Desktop + mobile WebM per school.** Doubles weight for little gain on this gallery. Rejected.

## Capture contract

- Script: `scripts/capture-centrolisto-client-previews.mjs`.
- npm: `"previews:centrolisto": "node scripts/capture-centrolisto-client-previews.mjs"`.
- Default origin: `http://localhost:3000`. URL: `http://{slug}.localhost:{port}/es`.
- Source list: enabled Pulsar tenants except the platform slug. Skip a slug if the home is not 200.
- Viewport: 1440×900. Record the first screen only.
- Motion: wait for the hero to paint, then a slow scroll of ~400px and back (or hold if the page has its own motion). No cursor overlay. No login.
- Length: 5–7 seconds. Output `public/centrolisto/clients/{slug}.webm` and `{slug}.jpg` (first-frame poster). First ship: `golden` and `espaciozenit` only.
- Do not open `/dashboard`, `/admin`, or login.
- Re-run the script when a school landing changes. Commit both files in the same change.

## UI (`PulsarClientesView`)

- Keep the current title, lead, and verticals ledger.
- Replace the numbered text list with the gallery. Rule **44**: no icon-in-a-box grid, no pill row, no uppercase eyebrow on every card.
- Card: video (or poster if reduced motion / missing video) + `displayName` + visible `visitSite` (“Conocer su sitio en vivo”). Do not show `hostsLabel` or the host. `visitSiteNamed` is the accessible name of the link. Video is `aria-hidden`.
- Institute mark: one bundled school logo, **once**, before the name. About 112px tall. Width follows the mark. Same on video cards and text rows. Decorative (`alt=""`).
- If a tenant has no files, keep a short text row at the bottom. Do not invent media.
- Split the view if the file nears 250 lines (`PulsarClientPreviewCard.tsx`).

## Data

- Page sets `previewVideoSrc` / `previewPosterSrc` only when those files exist (`existsSync` on `public/…`).
- Page sets `logoSrc` from the first existing bundled path (`/images/<slug>/logo/1.png` or `logo.png`). Do not invent a mark.
- No new table. No Storage upload.

## Tests

- With both paths, the card renders a `video` whose `src` contains `/centrolisto/clients/nago.webm` and `poster` contains `nago.jpg`.
- Poster-only: image, no video.
- No media: no `video` and no preview image.
- Helper that resolves those paths is covered in isolation.
- Existing clientes copy tests stay green.

## Done when

- Each enabled local tenant that returns 200 has a committed WebM + WebP under `public/centrolisto/clients/`.
- `/es/clientes` on the Pulsar host plays those loops; the frame opens the live public URL.
- Reduced motion shows the still. Mobile is one column. No iframe. No dashboard capture.
- Vitest for the view + helper passes.

## Out of scope

- Live production crawls.
- A second mobile WebM per school.
- Per-locale extra videos.
- Admin UI to upload a custom shot.
- Changing tenant registry or hosts.

## Manual QA (user)

- With `dev:pulsar` up, open `http://nago.localhost:3000/es` and confirm the loop matches that home page.
- Open `/es/clientes` on `localhost:3000` (desktop and a phone width). Confirm autoplay, then tap a frame and land on that school’s public site.
- Enable reduced motion and confirm the poster stays still.
