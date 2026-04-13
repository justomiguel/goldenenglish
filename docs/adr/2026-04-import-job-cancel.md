# ADR: Cancel CSV import jobs from UI

## Context

The admin CSV import runs as a long job in KV and streams progress to `LongJobActivityModal`.
When a file is wrong or the operator uploaded a stale dataset, there was no way to stop the
job from the UI, and the backend always completed all rows.

## Decision

Add a cancel action for import jobs:

- A running import job can be cancelled from the activity modal.
- `DELETE /api/admin/import/jobs/[id]` marks the job as cancelled in KV.
- Worker progress hooks (`runBulkImportJobWithKv`) stop execution when the job is cancelled.

## Options considered

- **No cancel support (rejected):** simpler backend, but poor operator control on large files.
- **Hard process kill (rejected):** unsafe in serverless execution and not portable.
- **Cooperative cancellation via KV state (chosen):** compatible with existing job polling and
  predictable for UI and SSE clients.

## Consequences

- Positive: admins can stop mistaken imports without waiting for full completion.
- Positive: cancellation is observable in UI activity log and admin system audit.
- Risk: cancellation is cooperative; a row already running may complete before stop is observed.
- Follow-ups: keep cancellation copy localized in both dictionaries and test the new job log code.
