# Blog article media upload: blocking progress modal

**Date:** 2026-08-28  
**Status:** Approved (brainstorm)  
**Kind:** Design spec. Implementation plan after this file is reviewed.  
**Related:**
- `.cursor/rules/01-design-system.mdc` — Image file uploads (inline progress); true HTTP % via signed URL + XHR
- `.cursor/rules/11-long-running-jobs-ui.mdc` — `LongJobActivityModal` is for server jobs (imports), not a single Storage upload
- Existing blog upload: `performBlogMediaFileUpload` + `prepareBlogMediaFileUploadAction`

**Governing rules:** `03-architecture.mdc` (250-line ceiling; hooks own orchestration), `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `02-testing-tdd.mdc`, `30-harness-self-contained-tests.mdc`.

**ADR:** no. No new persistence, RLS, or vendor contracts.

## Intent

When an admin or teacher inserts an **image, video, or other file** into a blog article (body or materials), they see a **blocking modal** with a **real 0–100%** that tracks the Storage upload. The UI updates on each XHR progress tick. The modal closes by itself when the file is inserted or the upload fails. The wait never looks like a frozen editor.

## Decisions

| Topic | Choice |
|-------|--------|
| Approach | Client PUT to the existing signed Storage URL with `XMLHttpRequest.upload.onprogress`. No Upstash/KV, no SSE, no `importJobKv`. |
| Shell | New molecule `BlockingFileUploadModal` (`Modal` + `disableClose` + live % + `InlineUploadProgressBar`). Do **not** reuse `LongJobActivityModal` (import log / intro / explain). |
| Scope | Blog article editor only: **body** (toolbar image + attach file) and **materials** file picker. |
| YouTube / Vimeo embed | No modal. URL insert stays instant. |
| Multi-file | Sequential. One modal stays open for the batch. Shows “2 of 3”. |
| Cancel / dismiss | **None** in this cut. No X, no Escape, no scrim click while running. No abort button. Limit remains 50 MB. |
| Close | Auto-close on success (file inserted / material appended) and on failure (existing `fileError` shown; nothing inserted). |
| Preparing phase | Modal opens immediately. Phase label `common.fileUpload.progressReading` while `prepareBlogMediaFileUploadAction` runs. Bar **indeterminate**. The large center figure shows `…` (same as `InlineUploadProgressBar` indeterminate), not `0%`. |
| Uploading phase | Phase label `common.fileUpload.progressSending`. Determinate bar + integer **0–100** from `loaded/total`. Round with `Math.round`. If `total` is missing, stay indeterminate until `load` fires, then 100. |
| State owner | One hook on the locale card (`BlogArticleLocaleFields`), one modal for body **and** materials. Prevents two uploads / two modals on the same form. |
| Academic global content / events | Out of scope. The molecule and XHR helper may be reused later; do not wire them now. |

## UX

1. User picks file(s) from the body toolbar, attach chooser, or materials input.
2. Validation still runs first (`validateLearningTaskFile`). Invalid file: existing `fileError`, no modal.
3. Modal opens. Title from `common.fileUpload.modalTitle`. Filename is the current `File.name` (not translated). If `totalFiles > 1`, show `common.fileUpload.fileIndex` with `{current}` and `{total}` (1-based).
4. Center block (tokens, `font-display`, `aria-live="polite"`, `aria-atomic="true"`): spinner while running, large percent during upload, secondary phase line.
5. `InlineUploadProgressBar` under that block (same tokens as payments / materials today).
6. Editor and materials controls stay disabled for the batch (`isUploading`).
7. Success: insert HTML or push material (current behavior, including `syncMediaToAllLocales` / `syncMaterialToAllLocales`), then next file or close.
8. Failure mid-batch: stop the remaining files, close modal, show `fileError`. Files already inserted in this batch stay.

## Architecture

```
BlogArticleLocaleFields
  useBlogArticleMediaUpload (hook)
    BlockingFileUploadModal
    BlogArticleBodyEditor        → runUpload(file)
    BlogArticleMaterialsSection  → runUploads(files)
      performBlogMediaFileUpload(file, articleId, onProgress)
        prepareBlogMediaFileUploadAction   // unchanged
        uploadFileToSignedUrlWithProgress  // XHR PUT
```

### Units

| Unit | Path (indicative) | Does | Depends on |
|------|-------------------|------|------------|
| `uploadFileToSignedUrlWithProgress` | `src/lib/client/uploadFileToSignedUrlWithProgress.ts` | PUT the file to the signed upload URL. Calls `onProgress(percent: number)` on `upload.onprogress`. Resolves on HTTP 2xx; rejects on network / non-2xx. | Browser `XMLHttpRequest` only. No React. No Supabase client. |
| `performBlogMediaFileUpload` | existing | Prepare token, then call the XHR helper instead of `uploadToSignedUrl`. Optional `onProgress({ phase, percent })`. | Server action + helper. |
| `BlockingFileUploadModal` | `src/components/molecules/BlockingFileUploadModal.tsx` | Presentational. `open`, labels, filename, index, phase, `percent`, `indeterminate`. `disableClose` while `open`. | `Modal`, `InlineUploadProgressBar`. No fetch. |
| `useBlogArticleMediaUpload` | `src/hooks/useBlogArticleMediaUpload.ts` | Sequential uploads, modal snapshot, disable flag, error callback. | `performBlogMediaFileUpload`. |

Signed URL request must match today’s Storage contract (same bucket `BLOG_MEDIA_BUCKET`, same `createSignedUploadUrl` token, same PUT path and headers the JS client uses for `uploadToSignedUrl`). Do not add a finalize server action; metadata is still the storage path returned by prepare.

`onProgress` must be invoked from XHR callbacks in a way React can paint (plain `setState` in the hook is enough). Do not throttle so hard that the bar looks stuck; coalescing to the latest tick per animation frame is allowed.

## Copy

Extend `common.fileUpload` in **en.json, es.json, and pt.json** (same shape):

| Key | en | es | pt |
|-----|----|----|-----|
| `progressReading` | (existing) Preparing file… | Preparando archivo… | Preparando arquivo… |
| `progressSending` | (existing) Uploading… | Subiendo… | Fazendo upload… |
| `modalTitle` | Uploading file | Subiendo archivo | Enviando arquivo |
| `fileIndex` | `{current} of {total}` | `{current} de {total}` | `{current} de {total}` |

`FileUploadProgressLabels` stays `Dictionary["common"]["fileUpload"]` so the new keys type-check everywhere that type is used.

Reuse `common.loadingAria` for the spinner `sr-only` if needed. Do not add a cancel label.

## Error handling

| Case | UI |
|------|----|
| Invalid MIME / size | No modal. Existing `fileError`. |
| Prepare action `ok: false` | Modal was open (preparing). Close. `fileError`. No insert. |
| XHR error / non-2xx | Close. `fileError`. No insert for that file. If prepare already created a path, keep today’s behavior (no extra cleanup unless a path is already used for failed uploads — do not invent a new orphan-cleaner in this cut). |
| Empty file list | No-op. |

## Testing

TDD at each public surface. Tests live under `src/__tests__/`, self-contained.

1. **`uploadFileToSignedUrlWithProgress`** — mock `XMLHttpRequest`: progress 0→50→100 resolves; HTTP 400 rejects; `total === 0` stays off determinate percent until success.
2. **`BlockingFileUploadModal`** — while open, no header close; percent and phase text visible; `aria-busy` / live region present.
3. **`useBlogArticleMediaUpload`** — starting an upload shows the modal snapshot; success closes it; mocked `performBlogMediaFileUpload` failure closes and calls the error callback. Optional RTL smoke on `BlockingFileUploadModal` inside a locale-card is extra, not a substitute.

Keep `src/lib/**` and `src/hooks/**` coverage ≥ 90%.

## Out of scope

- Upstash / Vercel KV / SSE job snapshots
- Cancel / abort / retry button
- Determinate % for the signed-URL **prepare** action (opaque server step)
- Academic global content builder, event media, avatars, receipts
- Changing `LEARNING_TASK_MAX_FILE_BYTES` (50 MB) or allowed MIME types
- Replacing `InlineUploadProgressBar` on other surfaces

## Done when

1. Body image, body attach-file (including video), and materials file upload on create/edit blog article show the blocking modal with live integer % during the Storage PUT.
2. YouTube/Vimeo chooser does not open the modal.
3. Escape / scrim / header X cannot dismiss the modal while a file is in flight.
4. Modal auto-closes; editor is usable again; success inserts the same HTML / material as today.
5. Dictionaries en/es/pt stay aligned. No user-facing literals in TSX.
6. Tests above pass alone. Coverage gate stays green.
