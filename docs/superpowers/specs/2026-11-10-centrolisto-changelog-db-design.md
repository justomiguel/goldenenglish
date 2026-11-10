# Product changelog in the CentroListo database

Date: 2026-11-10
Status: approved for the table, the seed, and the read path. The CentroListo editor stays out of this change.

## Understanding

- Instituto → Novedades del sistema reads a TypeScript list split across `src/lib/product-changelog/catalogEntries*.ts`.
- A new note today needs a code edit and a deploy. The 250-line file limit keeps splitting that list.
- The notes are the same for every institute. They belong on the CentroListo control plane (Pulsar), not in each institute database.

## Decision

Store one row per note in Pulsar. The institute page reads those rows. The TypeScript catalog stops being the source.

## Plan

1. New Pulsar migration `supabase/pulsar-migrations/020_platform_changelog.sql`.
   - Table `public.platform_changelog_entries`.
   - Columns: `id text` primary key, `published_on date`, `area text` (the existing area ids), `title_es`, `title_en`, `title_pt`, `summary_es`, `summary_en`, `summary_pt`, `created_at`.
   - RLS on. No anon or authenticated policy. The server reads and writes with the Pulsar service role.
   - Index on `published_on desc, created_at desc`.
2. The same migration copies the current catalog into that table, so history stays. After it applies, delete the `catalogEntries*.ts` files.
3. `listProductChangelogEntries` becomes a server read of Pulsar, paged at 1000. `resolveProductChangelogCopy` stays pure and picks `es`, `en`, or `pt`.
4. Instituto → Novedades and the admin home widget keep the same layout. They receive the rows as props. If Pulsar fails, the page shows an empty list and a sentence with a stable code, and the server logs `[ge:server]`.
5. Retire the commit rule that forces a new object in `catalog.ts`. A product note is a new `insert` in `supabase/pulsar-migrations/`. A CentroListo editor is a later change.

## Surfaces (Web vs PWA)

- Instituto → Novedades is Tier B, desktop-only. The page does not change shape. It only changes where the rows come from.
- This change does not add a CentroListo editor. There is no PWA tree for these notes.
- Shared copy helpers stay pure. The PWA trees do not read this list.

## Options considered

- Keep the notes in code. Rejected: every note is a deploy, and the file split is already in the way.
- Store the list in each institute database. Rejected: one product note would be written N times and the institutes would drift.
- Store the list as one JSON blob on `platform_settings`. Rejected: a blob does not page, and an edit rewrites the whole history.

## Follow-up

A new note is a Pulsar migration `insert` until CentroListo has an editor. That editor is not part of this change.

## Risks

| Risk | Mitigation |
|---|---|
| Pulsar is down and the page is blank. | Empty state with a code. The log has the same code. The page does not throw. |
| The seed misses a note. | A test counts the seeded ids against the catalog before the catalog files are deleted. |
| An institute calls Pulsar on every admin home view. | One read, explicit columns, ordered by date. Cache is out of scope. |

## Definition of done

- Pulsar has the table, the current notes, and RLS that blocks the browser.
- Instituto → Novedades and the home widget render those rows in the active locale.
- The TypeScript catalog files are gone. The commit rule asks for a SQL `insert`, not a catalog object.
- Vitest covers the copy picker, the seeded ids, and the empty failure code.

## Out of scope

- Notes that differ per institute.
- A public marketing changelog.
- Editing the note from an institute admin screen.
