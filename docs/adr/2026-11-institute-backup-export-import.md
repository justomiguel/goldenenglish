# Institute backup export and import

## Context

A shared-schema institute lives in the Pulsar project: one `platform_tenants` row, the schema `tenant_<slug>`, Auth users tagged with that schema, and Storage objects under `tenant_<slug>/`. Closing the institute deletes those parts. There is no file that can build them again.

The backup file also holds password hashes and institute-owned API keys. The server must not keep the passphrase.

## Decision

- CentroListo staff export and import from the tenant admin. The owner of an institute may export that institute. Only staff may import, because the institute does not exist yet.
- The file is a ZIP sealed with AES-256-GCM. The key comes from scrypt of a passphrase typed at export and at import. The server does not store the passphrase.
- The file omits the shared Pulsar URL, anon key, service role key, and database URL. Import reads those from the current process. The file does include institute-owned secrets (mail, WhatsApp, maps, KV) because the restore needs them.
- Import builds the schema with the migrations in this deploy, then loads rows. A backup whose last migration file is not in this deploy is refused.
- A failed import runs the close flow and deletes the tenant row.
- Close deletes every object under `tenant_<slug>/` in every bucket, so a later import does not meet leftover files.

## Options considered

- A plain ZIP. Rejected: the file holds password hashes and would be readable on a laptop.
- Supabase project backups for `shared_schema`. Rejected: one project holds every institute, so a project backup cannot restore one institute alone.
- Import on top of an existing institute. Rejected for this version: a merge can hide a half restore.

## Consequences

- Tests cover the seal, the passphrase, the checksum, the refusal codes, and a failed import that rolls back.
- A cron deletes transit objects in `institute-backups` after 7 days. The downloaded file is the backup.
- Staff must keep the passphrase with the file. A lost passphrase cannot be recovered.
