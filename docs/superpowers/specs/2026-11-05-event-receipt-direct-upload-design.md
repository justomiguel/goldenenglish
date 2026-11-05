# Event registration: direct-to-Storage uploads, receipt before enrollment

## Context

Public event registration (`/[locale]/events/[slug]/register`) with bank transfer:

1. `POST /api/events/[slug]/enroll` creates the attendee with status `pending_payment`.
2. Then `POST /api/events/[slug]/payment-receipt` sends the receipt as `multipart/form-data` through the Vercel function.

Production incident (2026-11-05, `gala-liora-…`): the attendee was created, the receipt failed, and the guest list shows "Pago pendiente" with no receipt. Vercel shows only the `enroll` logs. No `payment-receipt` invocation exists.

Root cause:

- A Vercel Function request body is capped at **4.5 MB**. The platform rejects a larger body with `413` before Node starts. The app cannot log it.
- The client allows receipts up to **15 MB** (`EVENT_TRANSFER_RECEIPT_MAX_BYTES`). A phone photo of 4.5–15 MB passes client validation and fails at the platform.
- `next.config.ts` `serverActions.bodySizeLimit: "16mb"` applies only to Server Actions, not to Route Handlers.
- The receipt is sent **after** the attendee exists. A failed upload leaves a `pending_payment` attendee with no `event_payments` row.
- The custom field files (`POST /api/events/[slug]/field-file`) have the same 4.5 MB defect.

## Decision

1. The browser uploads every registration file **directly to Supabase Storage** with a signed upload URL. The file bytes never cross a Vercel function.
2. The receipt is uploaded **before** enrollment, to the same staging area that custom field files already use.
3. `enroll` receives the staged receipt path. After a successful enrollment that requires payment, the server attaches the receipt and creates the `pending` `event_payments` row in the same request.
4. If the receipt attach fails, the server cancels that attendee (status `cancelled`, seat locks released). The person gets a retry message. No guest stays in "Pago pendiente" without a receipt.

### Options considered

- **Raise the limit / keep multipart** — not possible on Vercel for Route Handlers. Rejected.
- **Compress images in the browser** — does not help with PDFs and still fails for large files. Can be added later. Rejected as the fix.
- **Keep the order and roll back on failure** — the platform 413 gives the server no hook. The client would have to call a second "undo" endpoint, and that call can fail too. Rejected.

## Plan (layers)

### Pure (`src/lib/events/`)

- `buildEventReceiptStagingPath({ eventId, stagingKey, filename, mime })` → `${eventId}/staging/${stagingKey}/receipt/<name>-<stamp>.<ext>`. Reuses the helpers in `buildEventFormFieldStagingPath.ts`.
- `isEventStagingPathOwnedBy({ path, eventId, stagingKey, segment })` → path guard for enroll.

### Server (`src/lib/events/server/`)

- `prepareEventRegistrationUpload` — validates slug/event, identity (email + DNI → `stagingKey`), kind (`receipt` | field id), and size/type with `validateEventTransferReceiptFile` / `validateEventFormFieldFile`. Returns `{ path, token }` from `createSignedUploadUrl` on `event-uploads`.
- `attachEventPaymentReceiptServer` — extracted from `uploadEventPaymentReceiptServer`: checks the object exists in Storage, moves it to the final path (`buildEventPaymentReceiptPath`), inserts/updates `event_payments` (`pending`, `receipt_storage_path`), and calls `notifyAdminsEventReceiptPending`.
- `enrollEventAttendeeServer` — new optional input `receiptStagingPath`. When `paymentRequired` and the path is set, it calls the attach step. On failure it sets the attendee to `cancelled`, releases seat locks, and returns `receipt_attach_failed`.
- Validation in enroll: a transfer registration that needs a receipt and has no valid staged path returns `receipt_required` **before** the RPC runs.

### Routes (`src/app/api/events/[slug]/`)

- New `upload-url/route.ts` (JSON only, small body). Same IP rate limit as `field-file`. `Cache-Control: private, no-store`.
- `enroll/route.ts` — accepts `receiptStagingPath` in the Zod body.
- `field-file/route.ts` and `payment-receipt/route.ts` — remove. Their only callers are `uploadEventAttendeeFieldFile` and `uploadEventPaymentReceipt` (client helpers), and both are replaced.

### Client

- `src/lib/client/uploadEventRegistrationFile.ts` — calls `upload-url`, then `uploadFileToSignedUrlWithProgress` (XHR PUT with `upload.onprogress`). Logs failures with `logClientWarn` (`[ge:client]`, scope `events.registerUpload`, HTTP status, no PII).
- `useEventRegisterSubmit` — order becomes: validate → upload field files → upload receipt → enroll (with paths) → success / gateway. The old "registered but upload failed" branch is removed.
- Progress: the footer bar shows a determinate percent per file (rule 48), not only the indeterminate state.

### Copy (`en.json`, `es.json`, `pt.json`)

- `events.register.transferReceipt.uploadFailed` → "No pudimos subir el comprobante. Revisa tu conexión e intenta de nuevo." (the registration did not happen).
- New `receiptAttachFailed` for `receipt_attach_failed`.
- Upload progress label with `{percent}` if the existing key does not support it.

### Observability

- `upload-url`: `logServerWarn` for each rejected code (`invalid_file`, `event_not_found`, `field_not_found`), `logSupabaseClientError` for a signing failure.
- `enroll`: `logServerWarn` for `receipt_required` / `receipt_path_mismatch`, `logServerActionInvariantViolation` for `receipt_attach_failed`.
- Client `[ge:client]` log for a direct Storage failure (the server never sees that request).

### Changelog

- `PRODUCT_CHANGELOG_ENTRIES`: "Comprobantes grandes en inscripciones a eventos" — receipts up to 15 MB upload with a progress bar, and a failed receipt no longer leaves a pending guest.

## Surfaces (Web vs PWA)

Tier A (public event registration). The screen has one tree: `EventRegisterPurchaseFlow` with a `surfaceVariant` prop. Both surfaces use the same hook `useEventRegisterSubmit` and the same `EventRegisterFormFooter`.

- **Web (`web-desktop`)**: same form. The footer progress bar shows the percent.
- **PWA (`web-mobile` / `pwa-mobile`)**: same flow. This is the main beneficiary (phone camera photos). The progress bar stays in the thumb-zone footer that exists today. No new layout.
- Shared hook signature (`submit(payload)`) does not change. Only internals change.

## Risks and mitigation

- **Orphan staged files** if a person abandons after upload. Custom field files already have this behavior. Out of scope here; note for a later staging sweep.
- **Signed URL abuse** (anonymous upload). The token is for one path, limited by the bucket (25 MB) and validated size/type, behind the IP rate limit.
- **Move between Storage paths fails** after the object is uploaded → treated as attach failure → attendee cancelled, retry message, logged.
- **Cancelling an attendee** sends no mail today on the enroll path. The `events.registered` mail is sent only after attach succeeds (move the call after attach).

## Tests (TDD)

- `buildEventReceiptStagingPath` / `isEventStagingPathOwnedBy` (pure).
- `prepareEventRegistrationUpload` — identity, size, type, unknown field, signing error.
- `attachEventPaymentReceiptServer` — insert vs update, missing object, write error → cleanup.
- `enrollEventAttendeeServer` — receipt required, path mismatch, attach failure cancels attendee and releases seats, success creates payment and mails once.
- `upload-url` route and `enroll` route body.
- `useEventRegisterSubmit` — receipt failure blocks enrollment (no `/enroll` call), success order, progress callback.
- `uploadEventRegistrationFile` client helper — sign error, PUT error, success.

## Definition of done

- A 10 MB photo receipt registers successfully on production limits (no body through Vercel).
- A failed receipt upload never creates an attendee.
- Every failure leaves a `[ge:server]` or `[ge:client]` log line with a stable code.
- Unit tests and the coverage gate pass. Changelog entry added.

### Manual QA (user)

- Register with a receipt > 5 MB from a phone (PWA and browser). The guest appears with the receipt in the Payments tab.
- Cut the network during the upload. The form shows the retry message. No guest appears.
- Check the Vercel logs for `upload-url` and `enroll`.

## Out of scope

- The guest who is already pending without a receipt. The admin can delete the guest or ask for the receipt.
- Browser-side image compression.
- Sweep of orphan staging files.
