# ADR: Render event attendee custom file/image fields as media

## Context

Custom registration fields of type `image` / `file` store only `file_storage_path` in
`event_attendee_field_values`. Admin attendees UI and PDF/XLSX exports previously showed
the raw Storage path, which is not usable for staff review.

## Decision

1. Loaders resolve short-lived **signed read URLs** from `event-uploads` (same bucket as
   payment receipts) and expose `fieldType`, `fileStoragePath`, `previewUrl`, plus a
   human `displayValue` basename.
2. Admin table and expanded details always render **image thumbnails** (click to open)
   for image-like answers; other files show an open link with the filename.
3. Exports enrich cells by **downloading** image bytes server-side:
   - PDF embeds thumbnails via `@react-pdf/renderer` `<Image>`.
   - XLSX embeds thumbnails via **ExcelJS** (SheetJS community cannot embed images).
4. Non-image files keep filename text in exports (no binary embed).

## Options considered

- Hyperlink-only in Excel/PDF: rejected — product asked for visible photos.
- Keep SheetJS and skip XLSX images: rejected — product asked for photos in XLSX.

## Consequences

- New dependency: `exceljs` for attendee XLSX exports with images.
- Signed URLs are admin-only, TTL ~5 minutes; export uses direct Storage download.
- Large images are capped (~8MB) at export download time; failures fall back to filename.
- PDF row density decreases when image columns are present.
- ExcelJS does not accept `webp`/`avif` embeds; those cells keep the filename text in XLSX
  (PDF still embeds via data URL when the renderer accepts the format).
