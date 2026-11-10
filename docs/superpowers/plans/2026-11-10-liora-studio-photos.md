# Liora studio photos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Liora stock photos with the approved studio stills and play six class videos in the gallery.

**Architecture:** A pure catalog in `lioraGalleryImages.ts` lists 15 photos and then 6 videos. The gallery organism renders that list. Section slots stay `inicio/1.jpg`, `historia/1.jpg`, and `oferta/1.jpg`–`4.jpg`. Binaries are compressed before they enter `public/images/liora/`.

**Tech Stack:** Next.js, Vitest, sharp, ffmpeg.

## Global Constraints

- Photos: JPEG, long edge at most 2000 px, quality 80, EXIF removed.
- Videos: H.264, long edge at most 1280 px, plus a JPEG poster.
- Logo and `modalidades/1.jpg`–`3.jpg` stay.
- Gallery copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Do not reuse `NagoGalleryVideoPlayer`.
- `LioraLandingGallery.tsx` stays under 250 lines.
- Opening a video starts playback, except when `prefers-reduced-motion: reduce`.
- No new analytics event. No push.

---

### Task 1: Catalog

- [ ] Red: catalog test expects 15 photos then `v1`–`v6`.
- [ ] Green: export `LIORA_GALLERY_ITEMS` from `src/lib/landing/lioraGalleryImages.ts`.

### Task 2: Gallery UI

- [ ] Red: gallery test shows a play control for video 1 and a `video` element after that frame opens. A photo frame does not render `video`.
- [ ] Green: `LioraGalleryVideoSlide.tsx` plus the carousel branch. Dictionary keys `play`, `pause`, `previewPlayAria`, and the updated carousel strings.

### Task 3: Slots and files

- [ ] Download the Drive ids in the spec. Write compressed files into `public/images/liora/`.
- [ ] Hero uses `object-center`.
- [ ] Rewrite `CREDITS.md` for the studio files.
- [ ] Add `supabase/pulsar-migrations/022_liora_studio_photos_changelog.sql`.

### Task 4: Check

- [ ] `npx vitest run` on the Liora gallery and section tests.
