# Restore an institute from a backup

## Export

1. Open the institute in CentroListo admin.
2. The institute must use the Pulsar database (`shared_schema`).
3. Choose **Download backup**.
4. Type your password and a passphrase of at least 12 characters.
5. Keep the `.cbk` file and the passphrase. The server does not store the passphrase.

The file holds the institute settings, table rows, Auth accounts with the same password hashes, and every Storage file under `tenant_<slug>/`, including logos and receipts.

## Import

1. Open **Restore from a backup** on the site list.
2. Only CentroListo staff can restore. The institute must not exist.
3. Pick the file, type the passphrase, and type your password.
4. The site creates the schema with the current migrations, then loads the rows, accounts, files, and domains.
5. If a step fails, the site deletes the partial institute.

## When the image folder cannot be written

On Vercel, `public/images/<slug>/` is read-only. The files still return to Storage. Commit those images in the repo when the host must serve them from `public/`.

## Transit files

The bucket `institute-backups` holds the file only so the browser can download it, or so an upload can be read. A daily cron deletes objects older than 7 days. Apply `supabase/pulsar-migrations/018_institute_backups_bucket.sql` on the Pulsar project before the first export.
