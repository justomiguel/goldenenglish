# Centro Listo client landing previews — Implementation Plan

> **For agentic workers:** Implement in this session with TDD. First ship captures **golden** and **espaciozenit** only.

**Goal:** `/clientes` shows a paper-frame gallery; Golden and Espacio Zenit play a silent home-page loop captured from `{slug}.localhost:3000`.

**Architecture:** Pure helper maps slug → public video/poster paths. The clientes page attaches those paths when the files exist. `PulsarClientPreviewCard` renders the muted loop. A Playwright script records the homes.

**Tech Stack:** Next App Router, Playwright Chromium, Vitest, dictionaries.

## Global Constraints

- Files ≤ 250 LOC. One main export per file.
- Copy in `en.json` + `es.json` + `pt.json`. Spanish tuteo.
- Rule 44: no icon-box grid, no pill row.
- No PWA tree. No dashboard capture.
- First media: `golden` and `espaciozenit` only.

---

## Task 1: Preview path helper

- [ ] RED: `src/__tests__/lib/pulsar/centrolistoClientPreviews.test.ts`
- [ ] GREEN: `src/lib/pulsar/centrolistoClientPreviews.ts`
- [ ] Attach video/poster only when `fileExists` is true.

## Task 2: Gallery card + Clientes view

- [ ] RED: extend `PulsarLandingPages.test.tsx` — video+poster for nago fixture; no media otherwise.
- [ ] GREEN: `PulsarClientPreviewCard.tsx` + update `PulsarClientesView.tsx` and `clientes/page.tsx`.
- [ ] Dictionary key for the gallery label if needed (`es`/`en`/`pt`).

## Task 3: Capture Golden and Zenit

- [ ] Script `scripts/capture-centrolisto-client-previews.mjs` + `previews:centrolisto`.
- [ ] Record `http://golden.localhost:3000/es` and `http://espaciozenit.localhost:3000/es` against the running `dev:pulsar`.
- [ ] Write `public/centrolisto/clients/{slug}.webm` + `.jpg`.

## Task 4: Verify

- [ ] Vitest for helper + landing pages.
- [ ] Manual QA (user): `/es/clientes` on localhost:3000. Agent checks HTTP 200 on media files.
