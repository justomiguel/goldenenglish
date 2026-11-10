# Institute backup — export and import (CentroListo admin)

Status: approved 2026-11-09.
ADR: `docs/adr/2026-11-institute-backup-export-import.md`.

## Intent

A CentroListo operator downloads one file that holds a whole institute. If the institute is later closed (`closePulsarTenantAction`), the operator imports that file and the institute comes back as it was: data, accounts, passwords, files, theme, and hosts.

## Decisions already taken by the user

- Export and import both live in the CentroListo admin, on the tenant record (`/admin/tenants/[slug]`). Import creates the institute again from the file.
- Scope v1: `data_mode = shared_schema` only. A `project` institute keeps the backups of its own Supabase project.

## Understanding

- A shared-schema institute is spread over five places. The close flow deletes all of them:
  1. The `platform_tenants` row (Pulsar `public`).
  2. The schema `tenant_<slug>` (tables, rows, ledger in `institute_migration_ledger`).
  3. `auth.users` + `auth.identities` rows with `raw_user_meta_data.tenant_schema = tenant_<slug>`.
  4. Storage objects under `tenant_<slug>/institute-public/` in `LANDING_MEDIA_BUCKET`.
  5. `public/images/<slug>/` and the Vercel hosts.
- A restore must rebuild all five. The schema must be built by the current migrations (`provisionSharedInstituteSchema`), and then the rows are loaded on top.

## Backup file

One file: `<slug>-backup-<YYYYMMDD-HHmm>.cbk`. It is a ZIP, encrypted with AES-256-GCM. The key comes from a passphrase that the operator types at export (scrypt). The server does not store the passphrase. Without it, nobody can open the file, so the file is safe to keep on a laptop or a drive.

Content of the ZIP:

| Entry | Content |
|---|---|
| `manifest.json` | Format version, slug, export time, actor id, last migration in the ledger, row count and SHA-256 per entry. |
| `tenant.json` | The `platform_tenants` row, without credentials (shared credentials are read again at import). |
| `schema/<table>.ndjson` | All rows of each table in `tenant_<slug>`, read in pages of 1000 (rule 13). |
| `auth/users.ndjson` | `auth.users` rows of the schema, with `encrypted_password`, so each person keeps the same password. |
| `auth/identities.ndjson` | `auth.identities` rows of those users. |
| `storage/<bucket>/<path>` | Every object under `tenant_<slug>/` in **every** bucket, read recursively. This covers `institute-public/` (logo, favicons, share image), landing media, receipts, avatars, and any other upload, because `bindInstituteDataPlane` puts all of them under that prefix. |

`public/images/<slug>/` is not a separate entry. `publishInstitutePublicImages` writes each file there and also mirrors it to `institute-public/` in Storage. Import writes the folder again from those Storage objects.

## Export flow

1. Operator opens the tenant record and clicks **Descargar backup** (Lucide `DatabaseBackup`).
2. Modal asks for the operator's password (step-up, rule 17) and a passphrase typed twice (min. 12 characters).
3. Server action validates, creates a long job (`importJobKv` pattern) and returns the job id.
4. The worker writes the entries, encrypts the ZIP, and uploads it to a new private bucket `institute-backups` (Pulsar project).
5. `LongJobActivityModal` + `LongJobLoader` show the steps from backend codes (`backup.schema`, `backup.auth`, `backup.storage`, …) with row counts.
6. At the end the person gets a signed URL valid 1 hour, and the download starts.
7. A cron removes objects in `institute-backups` older than 7 days. The person's copy is the backup; the bucket is only transit.
8. `platform_audit_log`: `tenant.backup.export` with slug, size, and counts (no PII).

## Import flow

1. In `/admin/tenants`, a new button **Restaurar desde backup** (Lucide `ArchiveRestore`) opens `/admin/tenants/restore`.
2. Operator picks the `.cbk` file, types the passphrase, and the own password (step-up).
3. The file goes to `institute-backups` through a signed upload URL, with `InlineUploadProgressBar` showing XHR percent (rule 48).
4. The server decrypts it and checks the manifest and every SHA-256. It refuses the file before any write when:
   - the slug already exists in `platform_tenants` or the schema `tenant_<slug>` exists;
   - a host in the file is already used by another institute;
   - the backup's last migration is newer than the migrations in this deploy;
   - an `auth.users` id or email already exists in the Pulsar project.
5. Long job steps:
   1. Insert `platform_tenants` (from `tenant.json`, with the shared Pulsar credentials).
   2. `provisionSharedInstituteSchema` (current migrations, grants, trigger, exposed schema).
   3. Load rows per table in one transaction per table, with `session_replication_role = replica` so FKs and triggers do not fire during the load. Columns in the file that the current table lacks are an error; columns the table has and the file lacks take their default.
   4. Reset each sequence to `max(id)`.
   5. Insert `auth.users` and `auth.identities` with the same ids and hashes.
   6. Upload storage objects and write `public/images/<slug>/` files when that path is writable.
   7. Attach the hosts in Vercel (same helper the create flow uses).
6. If any step fails, the job runs the close flow for that slug, so no half institute stays. The log says which step failed.
7. `platform_audit_log`: `tenant.backup.import`.

## Who may do it

- Export: CentroListo staff, and the owner of that institute (`resolvePulsarSiteActor`, same rule as close).
- Import: CentroListo staff only, because the institute and its owner link do not exist yet.
- Both require the step-up password. A staff member with `mustChangePassword` gets `password_change_required`.

## Error codes (rule 50)

Each code has its own sentence in `en.json`, `es.json`, `pt.json` under `admin.tenants.backup.errors.*`, logged with `[ge:server]` scope `pulsar.backup.export` / `pulsar.backup.import`:

`unauthorized`, `password_change_required`, `step_up_failed`, `passphrase_too_short`, `passphrase_mismatch`, `not_shared_schema`, `wrong_passphrase`, `file_corrupt`, `format_unsupported`, `backup_newer_than_app`, `slug_taken`, `schema_exists`, `host_taken`, `auth_user_exists`, `schema_load_failed`, `auth_load_failed`, `storage_failed`, `hosts_failed`, `job_not_found`. Unknown codes show the raw code.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The CentroListo tenant admin has no PWA tree. The new modal and the restore page do not change shared hooks or components used by Tier A screens.

## Proposed plan (layers)

| Layer | Work |
|---|---|
| Migration | `supabase/pulsar-migrations/0xx_institute_backups_bucket.sql`: private bucket `institute-backups` + policies (service role only). Audit actions are text, no enum change. |
| Pure lib | `src/lib/pulsar/backup/`: manifest schema (Zod), entry naming, checksum, encrypt/decrypt (Node `crypto`), table load order, error codes. |
| Adapters | `exportInstituteBackup.ts`, `importInstituteBackup.ts` (pg via the existing shared-schema connection, Pulsar admin client for storage). |
| Actions / routes | `startInstituteBackupExportAction`, `prepareInstituteBackupUploadAction`, `startInstituteBackupImportAction`, job GET + SSE routes on the long-job pattern, cron cleanup route with `verifyCronRequest`. |
| UI | `PulsarTenantBackupExportDialog`, `/admin/tenants/restore` page + `PulsarTenantRestoreForm`. |
| Copy | `admin.tenants.backup.*` in en/es/pt. |
| Docs | ADR, runbook `docs/runbooks/institute-backup-restore.md`. |
| Changelog | Entry `institute-backup-restore`, area matching the CentroListo admin. |

## Risks and mitigation

- **PII and password hashes in a file.** Encrypted with a passphrase the server never stores; step-up; audit; bucket private with a 7-day cleanup.
- **`session_replication_role = replica` needs elevated rights.** The Pulsar `postgres` role may lack it. Mitigation: check at the start; if denied, load tables in FK order read from `pg_constraint` and defer self-references. A test covers the order.
- **Large institutes vs the 300 s function limit.** The worker runs step by step on the long-job pattern and keeps progress in KV; each step resumes from the last finished table.
- **Schema drift.** The file stores the last migration; import refuses a newer backup, and an older backup is loaded into the current schema with defaults for new columns.
- **Close leaves uploads behind.** `closeInstituteDataPlane` deletes only `tenant_<slug>/institute-public/` in `LANDING_MEDIA_BUCKET`. Other uploads under `tenant_<slug>/` stay as orphans. In scope: close deletes the whole `tenant_<slug>/` prefix in every bucket, with a test, so a restore never meets old files.
- **Vercel filesystem is read-only.** `public/images/<slug>/` is restored only when writable; otherwise the job logs `images_skipped` and the runbook says how to commit those files.

## Definition of done

- Export of a shared-schema institute downloads one encrypted `.cbk` file.
- Close the institute, import that file: the same rows, users (login with the old password works), storage objects, theme, and hosts come back.
- Every refusal case above returns its code and sentence; no write happens.
- Failure mid-import leaves no tenant row, schema, or users.
- Vitest: manifest/crypto round trip, wrong passphrase, checksum mismatch, load order, each refusal code, action authz and step-up, UI busy/error states (one known code + unknown code).
- ADR + runbook written; changelog entry added.
- Manual QA (user): export → close → import on a test institute; log in as a student with the old password.

## Out of scope

- `project` mode institutes.
- Scheduled automatic backups.
- Restoring into an institute that still exists (merge or overwrite).
- Restoring under a different slug.
