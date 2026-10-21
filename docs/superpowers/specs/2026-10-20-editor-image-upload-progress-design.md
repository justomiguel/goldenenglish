# Editor image upload progress

**Intent:** Every content editor that uploads an image or file shows the same blocking progress modal the blog editor already uses. A silent wait looks frozen.

**Done when:**

- The event description editor shows `BlockingFileUploadModal` from file pick until the upload ends. The bar is determinate while bytes go to Storage.
- The global content body editor and its file picker use the same modal. The materials panel does not also show a second bar.
- The shop product photo field shows the same modal. The button loading state stays.
- Blog body uploads and email-template uploads keep one modal. They do not stack a second one.
- Copy comes from `common.fileUpload` in `en.json`, `es.json`, and `pt.json`.
- Vitest covers the event upload progress callback and that the event editor opens the modal while a file is in flight.

**Out of scope:**

- Uploaders that already render `InlineUploadProgressBar` or `BlockingFileUploadModal` (avatars, receipts, site setup, landing media, badges, section photos, registration files, learning-task library).
- A new progress component.
- Server-side job progress (`LongJobActivityModal`).

## Current gap

| Surface | Upload | Visible progress |
|---|---|---|
| Blog body | `performBlogMediaFileUpload` + `uploadFileToSignedUrlWithProgress` | `BlockingFileUploadModal` in `BlogArticleLocaleFields` |
| Email template body | `uploadEmailTemplateImage` | `BlockingFileUploadModal` in `EmailTemplateTiptapBody` |
| Event description | `performEventMediaFileUpload` via `uploadToSignedUrl` | Editor disables only |
| Global content body and files | `performGlobalMaterialFileUpload` via `uploadToSignedUrl` | Indeterminate bar on the materials panel only |
| Shop photo | `performShopMediaFileUpload` already reports bytes, but the caller ignores them | Button `isLoading` only |

## Decision

Reuse `BlockingFileUploadModal` and `common.fileUpload`. Switch the two silent Storage uploads to `uploadFileToSignedUrlWithProgress` and pass `onProgress`.

Show the modal in the screen that owns the upload:

1. `EventDescriptionEditor` — image button and clip-file attach.
2. `AdminGlobalContentBuilder` — inline image and materials files. Set `showInlineUploadProgress={false}` on the materials panel.
3. `AdminMerchPhotoField` — product photo.

Phases match the blog hook: `preparing` at 0% while the signed URL is requested, then `uploading` with the byte percent. Multi-file batches show `fileIndex` (`{current} of {total}`). Close the modal in `finally`, including on validation failure and upload failure.

## Tests

- `performEventMediaFileUpload` calls `uploadFileToSignedUrlWithProgress` and forwards percent.
- `performGlobalMaterialFileUpload` does the same.
- Event editor renders the modal title while upload is pending and hides it after resolve.
- Shop photo field renders the modal while upload is pending.

## Manual QA (user)

- Event editor: insert an image and attach a file. The modal shows a percent, then the media appears.
- Blog editor: one modal, then the image appears.
- Global content: image and file upload each show one modal.
- Shop product photo: the modal shows a percent, then the thumbnail updates.
