# Liora landing — studio photos and gallery videos

**Status:** approved 2026-11-10.

The user approved the photo board and chose to keep all six videos.

## Intent

Replace the Unsplash and Wikimedia stills on the Liora landing with photos from the studio Drive folder. Put the remaining chosen stills and six class videos in the gallery. Keep each pose distinct.

## Done when

- Hero, Sobre nosotros, and the four class cards use the files in the slot table.
- The gallery lists 15 photos, then 6 videos, in the order below.
- The three preview frames are photo 1, photo 2, and the poster of video 1 with a play icon. The video frame opens the carousel on video 1.
- Logo and the three sede flyers stay as they are.
- Photos are JPEG, long edge at most 2000 px, quality 80, EXIF removed.
- Each video is H.264, long edge at most 1280 px, with a JPEG poster.
- `CREDITS.md` names these files as studio photos. The Unsplash and Wikimedia lines for the replaced files go away.
- Dictionary keys for the gallery exist in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo.
- Vitest covers the catalog order and one video slide.

## Out of scope

- Sede flyers (`modalidades/1.jpg`, `2.jpg`, `3.jpg`) and `logo/logo.png`.
- Schedule, class copy, and sede copy.
- A CMS upload of this set. Section slots still honor an existing `site_theme_media` override.
- New analytics events. This change does not add a signed-in action.
- Push or deploy.

## Source

Public Drive folder `FERNANDA BALLET CLASES | 2026` (`1MQJEXsVgTwZQdQfXUGLajf13XJDJmRa_`).

Age rule, chosen by the user: Pre Ballet and Infantil use the younger children. Juvenil uses the oldest student. Adulto uses the purple-room class.

## Slots

| Slot | File | Drive id | Source name |
|---|---|---|---|
| Hero `inicio/1.jpg` | group at the barre | `1cMbxVy2g6OxsZJOgUDA96gHUlE_q3Pdu` | `DSC09864.JPG` |
| Sobre `historia/1.jpg` | teacher guiding an arabesque | `1eZT9bj8cKUhjV7L8PQQjxys79gGfhgph` | `DSC07743.JPG` |
| Pre Ballet `oferta/1.jpg` | youngest child in a play costume | `1jLTV5N20cKaNR-yuFSwgP3PjxkPQfQ1R` | `DSC08361.JPG` |
| Infantil `oferta/2.jpg` | child in a tutu, mid-step | `1S-n4zeIYhrAhcR3Ki6kPASzMO5GdVIcx` | `DSC07566.JPG` |
| Juvenil `oferta/3.jpg` | oldest student | `12uJfNc0XQOv8bRVliycnajAN_0Khw5BR` | `DSC09114.JPG` |
| Adulto `oferta/4.jpg` | adult in the purple room | `12hNrsoZja7Ft4d9X6lRFdHQNQUZ5IQKN` | `DSC00107.JPG` |

The hero image uses `object-center`. The old `object-[center_30%]` crop was for the stock photo.

## Gallery photos

Order is the carousel order. Files live in `public/images/liora/galeria/` as `1.jpg` … `15.jpg`.

| # | Pose | Drive id | Source name |
|---|---|---|---|
| 1 | stretch on the mat | `16Hn-n0dN1tcKocoqwQGn49xDzUrG2vqT` | `DSC05961.JPG` |
| 2 | wide class | `1ThhAk-kVo-DApXZQQIAYfm8-Vya9TwKM` | `DSC06165.JPG` |
| 3 | passé with the teacher | `1S_Qe4s2d1U7zbP1QiWWyfXD2-Eoflpze` | `DSC06348.JPG` |
| 4 | two children, arms up | `1IB0kBcJ4XNs5gCgcWFnK12g_cpAale2W` | `DSC06480.JPG` |
| 5 | group on the floor | `10oVQovlw7ZQUCwuEFweRJSgBc5T43KSG` | `DSC06555.JPG` |
| 6 | two children by the lights | `11h6rVjFgjsRnc2I2e6gMYlW-90K9Qyde` | `DSC07227.JPG` |
| 7 | hands on hips | `1F3bsmxRQ-N2AWIxFXZLSnMuo-oh42rHE` | `DSC07539.JPG` |
| 8 | backbend | `1S3UU2OZh6ZgA4x2ytXSVaSkNay75KOHi` | `DSC07851.JPG` |
| 9 | two adults | `1Bq2xuszlHbF7JGSns4IarsE174CwWFmN` | `DSC00308.JPG` |
| 10 | adult group | `1CJaiwCbaM7VnU5iomRmfNxvA2ppsHxGp` | `DSC00395.JPG` |
| 11 | sparkle tutu | `17tby6RgLuc88aGWEx29GhzS98C-mg6b6` | `DSC08304.JPG` |
| 12 | tutu from behind | `1Jaqd1hQF0ME8Tj-44vvxs4gIivJsn0L1` | `DSC08592.JPG` |
| 13 | boy and girl | `19IW30Jy_ZkyG6VVOP3OE2Oc7oA0UeNBw` | `DSC08859.JPG` |
| 14 | group, arms up | `1bYTrEs4orInQSH_13FUGyUsp3PnjrPC5` | `DSC09819.JPG` |
| 15 | arabesque at the barre | `1Gh_dV-oxVoSR9vo5H3NN8SmMGCSpx2c7` | `DSC09909.JPG` |

Chin-on-hands portraits stay out. Near-duplicate seated portraits stay out.

## Gallery videos

Files are `v1.mp4` … `v6.mp4` with posters `v1.jpg` … `v6.jpg`. They follow the 15 photos in the carousel.

| # | Clip | Drive id | Source name |
|---|---|---|---|
| 1 | relevé, arms up | `1pHxGMp17DNyodyBZxrlQoBl5fNQ5qIIC` | `C0393.MP4` |
| 2 | arabesque correction | `1lJF7HFrV6jPJV7e6ISIQbUYQKZ0yQP3a` | `C0401.MP4` |
| 3 | dance with a veil | `1Ih0vRP0JtQ3xiE7l-tYCHKD89I5S_dIm` | `C0406.MP4` |
| 4 | tutu by the window | `1oPbDq5UmRtQE2YUFSRlfg0V1vLvdZPNm` | `C0426.MP4` |
| 5 | boy at the barre | `11iRiupOINBqjDrdP5qOeTEZRLv2yNFe3` | `C0427.MP4` |
| 6 | adult class | `14DalVi4seBYCOCA-d3WgQa3IglVO8IaQ` | `C0432.MP4` |

## Behavior

`src/lib/landing/lioraGalleryImages.ts` exports an ordered list of items. Each item is a photo or a video. Photo URLs stay under `/images/liora/galeria/`. Video URLs point at the mp4. Poster URLs point at the jpeg.

`LioraLandingGallery` keeps the current section, modal, and keyboard arrows. A photo slide stays `next/image` with the existing loader. A video slide renders a `<video>` with `playsInline`, a poster, and play/pause. Playback starts after the person opens that slide. A reduced-motion preference does not autoplay.

The player is its own file so `LioraLandingGallery.tsx` stays under 250 lines. Do not reuse `NagoGalleryVideoPlayer`. That player uses Nago tokens.

Opening a video slide starts playback. If the person prefers reduced motion, the slide stays on the poster until they press play.

Copy changes, same keys in all three dictionaries:

- `verMas` names photos and videos.
- `carouselPrev` and `carouselNext` say previous and next item, not only photo.
- `carouselPosition` is `{current} of {total}` in English, `{current} de {total}` in Spanish, and `{current} de {total}` in Portuguese. A video slide is not called a photo.
- Add `play` and `pause` for the video control.
- `previewOpenAria` stays for photo frames. Add `previewPlayAria` for the video frame.

## Surfaces (Web vs PWA)

Tier A public landing. There is no `useAppSurface` split and no `src/components/pwa/` tree for Liora. This change does not add one.

- Web (`web-desktop`): three preview frames in a row. The carousel stays in the current modal.
- Narrow (`web-mobile` / `pwa-mobile`): the same component. Frames stack. Controls stay at least 44 px. The section keeps its safe-area padding.

## Tests

- Update `src/__tests__/lib/landing/lioraGalleryImages.test.ts`. Assert 15 photos, then 6 videos, in this order.
- Add a gallery component test. A video item renders a `video` element and a play button. A photo item does not render `video`.
- Keep `LandingLioraSections` hero assertion on `/images/liora/inicio/1.jpg`.

## Manual QA (user)

- Open the Liora landing. Confirm the six slots and that the sede flyers are unchanged.
- Open the gallery. Step through a photo and a video. Play and pause the video.
- Check a narrow viewport. The frames stack and the buttons stay easy to tap.

## Changelog

Staff and families will see the new photos after deploy. The implementation commit adds a `platform_changelog_entries` row in `supabase/pulsar-migrations/`. Area `site`. Id `liora-studio-photos`.
