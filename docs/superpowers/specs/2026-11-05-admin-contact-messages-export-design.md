# Admin contact-form message export

**Intent:** On Instituto → Mensajes, an admin exports public contact-form messages to Excel or PDF. The admin picks which of six fields are columns. The PDF uses the active institute brand.

**Done when:**

- The messages header opens an export dialog.
- The dialog offers two scopes. **Todos** is selected by default. **Últimos 2000** keeps the 2000 newest unique submissions.
- The dialog lists these fields, all checked by default: send date, message body, name, subject, email, phone.
- At least one field must stay checked.
- Excel and PDF download only the checked fields, in that fixed order: date, name, email, phone, subject, body.
- The file contains contact-form messages only. Internal messages stay out.
- Copies of the same submission (one row per admin, same `broadcast_batch_id`) become one export row.
- The PDF header shows the institute logo, name, and legal name from the brand layer. The document title uses the brand primary color.
- A non-admin cannot run the export.
- Vitest covers field parsing, column selection, dedupe, and the admin gate.

**Out of scope:**

- CentroListo `/cuenta/mensajes` (those rows have no subject).
- Export of internal portal messages.
- Export of only the rows checked in the bulk bar.
- CSV.
- Editing the public contact form.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree).

Admin Mensajes lives at `src/app/[locale]/dashboard/admin/messages/page.tsx`. There is no `useAppSurface` branch and no file under `src/components/pwa/` for this screen. The dialog is an admin modal on that desktop page. Shared student or parent components stay untouched.

## Context

`submitPublicContactForm` stores each public submission in `portal_messages`. The sender is the site-contact profile. Name is `external_contact_display_name`. Email is `external_contact_reply_email`. Subject, phone, and body live in `body_html` (subject and meta lines, then `<hr />`, then the body). The insert is repeated once per admin and shares `broadcast_batch_id`.

The inbox already labels those rows `contact_form`. The list loader stops at 500 mixed rows. The export uses its own query.

Brand header already exists for event attendee PDFs: `loadReceiptBrandForRequest` plus `@react-pdf/renderer`. Excel already uses ExcelJS.

## Decision

1. Add **Exportar formulario** on the messages header. It opens a modal.
2. The server action accepts `locale`, `format` (`xlsx` | `pdf`), `fields` (subset of the six ids), and `scope` (`all` | `latest_2000`).
3. The action requires an admin session. It reads messages the admin can already see (`sender` role `site_contact`), newest first, in pages of 200. `all` reads until the query ends. `latest_2000` stops after 2000 unique rows.
4. Dedupe by `broadcast_batch_id` while reading. A row with no batch id stays as its own row. The 2000 count is unique rows, after dedupe.
5. A pure parser builds the six values. Name and email prefer the columns. Subject, phone, and body come from the HTML. Phone reuses `contactMetaPhoneCandidates`.
6. Excel is a table with dictionary headers. PDF reuses the event letterhead pattern (logo, institute name, legal name, legal registry, title in `primaryColor`) and the same table. No event cover image.
7. `latest_2000` is the admin's choice, so the file is not a surprise truncation. The dialog does not add a second warning.
8. `recordSystemAudit` stores format, scope, field ids, and row count. It does not store names, emails, phones, or message text.

## Options considered

- Export the current inbox array. Rejected. That array mixes internal mail and duplicates each contact submission.
- Add a subject and phone column in Postgres. Rejected for this task. The HTML already holds those values, and a migration is not required to export them.
- A fixed cap of 2000 with a truncation notice. Rejected. The admin chooses **Todos** or **Últimos 2000** in the dialog.

## Consequences

- Admins can download visitor email and phone in bulk. The action stays behind the admin session. Logs and audit omit that text.
- **Todos** can produce a large file when the body column is included. The admin can choose **Últimos 2000** instead.
- ADR: `docs/adr/2026-11-05-admin-contact-messages-export.md` (auth gate, PII in the file, audit payload).

## Plan outline

1. Pure parser and table builder under `src/lib/messaging/export/`, with Vitest.
2. Server action next to the messages actions. Admin check, chunked read, dedupe, ExcelJS or react-pdf, audit, `[ge:server]` on failure.
3. Modal on `AdminMessagesHeaderActions`. Dictionary keys in `en.json`, `es.json`, and `pt.json`. Spanish uses tuteo.
4. Product changelog entry when the feature ships.

## Risks

- Old HTML may omit a label. The cell stays empty. The row still exports.
- Logo fetch can fail. The PDF still renders the name block.
- **Todos** can be slow or hit a request time limit on a very large inbox. **Últimos 2000** is the smaller choice in the same dialog.

## Manual QA (user)

- Open Mensajes, export Excel with only date and email, and confirm other columns are absent.
- Export PDF and confirm the institute logo and name.
- Confirm an internal message is not in the file.
- Export with **Últimos 2000** and with **Todos**.
