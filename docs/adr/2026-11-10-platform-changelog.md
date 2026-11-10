# Product changelog lives in CentroListo

Date: 2026-11-10

## Context

Instituto → Novedades del sistema showed one list for every institute. That list lived in TypeScript files under `src/lib/product-changelog/`. A new note required a code change and a deploy. The 250-line limit kept splitting the list.

## Decision

Store the notes in `public.platform_changelog_entries` on the CentroListo database. The institute server reads them with the Pulsar service role. The browser has no policy on that table. The current notes move in `supabase/pulsar-migrations/020_platform_changelog.sql`. The TypeScript entry files are deleted.

## Options considered

- Keep the notes in TypeScript. Rejected: every note is a deploy, and the files already hit the line limit.
- Copy the table into each institute database. Rejected: one note would be written once per institute, and the copies would drift.
- Store the list as one JSON value on `platform_settings`. Rejected: an edit would rewrite the whole history, and the value would not page.

## Consequences

- A failed read shows `changelog_unavailable` on the page and in the `[ge:server]` log.
- A later note is a new Pulsar migration until a CentroListo editor exists.
- Tests cover the copy picker, the seeded ids, and the failure code.
