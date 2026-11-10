# Institute backup export and import — implementation plan

> **For agentic workers:** Implement task by task. The spec is `docs/superpowers/specs/2026-11-09-institute-backup-export-import-design.md`. The ADR is `docs/adr/2026-11-institute-backup-export-import.md`.

**Goal:** A CentroListo operator downloads one encrypted `.cbk` file and can recreate that shared-schema institute from it after a close.

**Architecture:** Pure modules seal the ZIP, check the manifest, and order tables. Adapters read and write Postgres, Auth, and Storage through injected ports. Actions start a long job. The UI polls that job.

**Tech stack:** Next.js App Router, `fflate`, Node `crypto`, Pulsar admin client, Vitest.

## File map

- `src/lib/pulsar/backup/backupArchive.ts` — seal, open, checksum.
- `src/lib/pulsar/backup/backupPreflight.ts` — refusal codes before any write.
- `src/lib/pulsar/backup/tableLoadOrder.ts` — FK order.
- `src/lib/pulsar/backup/backupSql.ts` — quoted SQL for pages and inserts.
- `src/lib/pulsar/backup/collectTenantStoragePaths.ts` — recursive prefix walk.
- `src/lib/pulsar/backup/tenantBackupDocument.ts` — tenant JSON without shared credentials.
- `src/lib/pulsar/backup/buildInstituteBackup.ts` — read ports, return files.
- `src/lib/pulsar/backup/restoreInstituteBackup.ts` — write ports, roll back on failure.
- `src/lib/pulsar/backup/backupJobStore.ts` — job JSON in the `institute-backups` bucket.
- `src/lib/pulsar/backup/backupErrorSentence.ts` — dictionary sentence or raw code.
- `src/lib/pulsar/closeInstituteDataPlane.ts` — delete the whole `tenant_<slug>/` prefix.
- Actions, job routes, cron, restore page, dialogs.
- `supabase/pulsar-migrations/018_institute_backups_bucket.sql`
- Dictionaries, changelog, runbook.

## Tasks

1. Archive round trip, wrong passphrase, bad checksum, unknown version.
2. Preflight refusals and table order.
3. Close deletes every bucket under the schema prefix. Update the close test.
4. Build and restore with fake ports, including rollback.
5. Actions: auth, step-up, `not_shared_schema`, job id. Cron rejects `?secret=`.
6. UI: export dialog, restore page, progress bar, known and unknown error codes.
7. Copy in en, es, pt. Changelog entry. Runbook.

## Manual QA (user)

Export a test institute, close it, import the file, and sign in as a student with the old password.
