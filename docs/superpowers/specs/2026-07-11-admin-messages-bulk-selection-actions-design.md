# Admin messages: multi-select bulk actions

**Intent:** Let admins **select several inbox/sent rows** and run **bulk actions**: delete, mark as read, mark as unread (inbox only for read/unread). Keep the redesigned list (chips, stats, per-row toggle) and add a clear selection UX.

**Done when:**

1. **Selection** — Each list row has a checkbox (leading). Header/toolbar control: **Select all visible** / **Clear selection** for the active folder’s loaded rows.
2. **Bulk bar** — When `selection.size ≥ 1`, a sticky or inline action bar shows count + actions with Lucide icons (**`16`**):
   - **Mark as read** (inbox)
   - **Mark as unread** (inbox)
   - **Delete** (inbox + sent) — confirm via `ConfirmActionModal` (**`18`**), not native dialogs
3. **Server** — One admin-gated server action per bulk op (or one action with `op` enum), Zod-validated UUID array (cap e.g. **100** IDs per request). Reuses existing attention/delete semantics; chunked `.in("id", ids)` where needed (**`13`**). `revalidatePath` + client `router.refresh()` (**`27`**). Structured `[ge:server]` logs on failure (**`25`**). Audit: one `recordSystemAudit` per bulk delete (or batched payload with count + truncated ids).
4. **UX** — Selection clears after successful bulk action; folder tab change clears selection; disabled/busy state while pending; dictionary copy en/es/pt for bar, checkboxes `aria-label`, confirm delete plural.
5. **Tests** — Pure helper for selection/cap; Vitest for bulk action auth/validation (mocked supabase); RTL smoke for checkbox + bar visibility; no brand literals.
6. Spec/plan under `docs/superpowers/`; no new tables (uses `read_at` + existing delete RLS).

**Out of scope:**

- Select across pagination beyond the current loaded mailbox window (~500).
- Bulk “needs reply” / external reply.
- Parent/student/teacher mailboxes.
- Real-time multi-admin selection sync.

## Understanding

- Today: per-row delete + per-row read toggle only.
- Delete and read-state helpers already exist for single IDs; bulk is orchestration + UI.

## Design defaults (on OK)

| Topic | Default |
|-------|---------|
| Where | Received + Sent; read/unread only on Received |
| Select all | All **visible loaded** rows in active tab |
| Delete confirm | Modal: “Delete N messages?” |
| Cap | Max 100 IDs per bulk request |
| Layout | Checkbox on row; bar above list when selection non-empty |

## Risks

| Risk | Mitigation |
|------|------------|
| Accidental mass delete | Confirm modal + explicit count |
| Oversized `.in()` | Cap 100 + chunk if needed |
| Clicking checkbox opens detail | `stopPropagation` / separate control from Link |

## Manual QA (user)

- Select 2–3 → mark read/unread → counters update.
- Bulk delete with confirm; cancel leaves rows.
- Select all then clear; switch tab clears selection.

## Open questions

None blocking — defaults above apply on “OK”.
