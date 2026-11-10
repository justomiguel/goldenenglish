# Shared events implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An owner admin can ask to share one event with other institutes. CentroListo approves. The row stays in the owner database. Guests show it with their own look and manage that same row.

**Architecture:** Grant rows live in CentroListo (`event_share_grants`). `resolveEventDataClient(eventId)` returns the current institute client, or the owner service-role client when the current slug has an approved grant. Public pages, registration, mail, and admin mutations go through that client. `entry_host_slug` on `event_attendees` picks the mail brand.

**Tech Stack:** Next.js App Router, Supabase, Vitest, Pulsar migrations, institute migrations.

**Spec:** `docs/superpowers/specs/2026-11-10-shared-events-design.md`

## Global Constraints

- One event row. It lives in the owner database.
- Guest admin is checked on the guest site. The owner service role then writes that event only.
- Payment account stays the owner account.
- Mail brand follows `entry_host_slug`. Null means the owner host.
- Archive sets `archived_at` and closes every grant for that event. Both admins may archive.
- `show_on_home` writes the owner column and affects only the owner home.
- A local guest slug hides the shared event. The grant may still be approved. The owner summary shows `slug_taken`.
- Copy in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo. Each error code has its own sentence.
- Buttons use a leading Lucide icon.
- Files stay under 250 lines.
- No worktree. Work on `main`.
- One commit at the end with the spec, this plan, and the implementation. Do not commit per task.
- ADR: `docs/adr/2026-11-10-shared-event-guest-admin.md`.
- Changelog row in a new `supabase/pulsar-migrations/` file before that commit.

## File map

| File | Job |
|---|---|
| `src/lib/events/eventShareGrant.ts` | Pure status changes and request checks. No Supabase. |
| `src/lib/events/mergeSharedPublicEvents.ts` | Pure public-list merge. Local slug wins. |
| `src/lib/events/server/eventShareGrantStore.ts` | Pulsar reads and writes for grants. |
| `src/lib/events/server/resolveEventDataClient.ts` | Current client or owner admin client. |
| `src/lib/events/server/eventShareMailBrand.ts` | Brand and template source from `entry_host_slug`. |
| `supabase/pulsar-migrations/029_event_share_grants.sql` | Grant table. |
| `supabase/migrations/270_event_attendee_entry_host.sql` | `entry_host_slug`. |
| `src/app/[locale]/dashboard/admin/events/eventShareActions.ts` | Owner request and unshare. |
| `src/app/[locale]/admin/eventShareActions.ts` | CentroListo approve and reject. |
| `src/components/dashboard/admin/events/AdminEventShareSection.tsx` | Owner summary control. |
| `src/components/organisms/pulsar/PulsarAdminEventShareQueue.tsx` | Fleet `shares` tab. Desktop list and narrow list. |

## Interfaces

```ts
export type EventShareStatus =
  | "pending"
  | "approved"
  | "pending_unshare"
  | "rejected"
  | "closed";

export type EventShareCode =
  | "share_self"
  | "share_target_unknown"
  | "share_already_open"
  | "share_not_approved"
  | "share_forbidden"
  | "slug_taken"
  | "event_title_unavailable";

export function decideShareRequest(input: {
  ownerSlug: string;
  guestSlug: string;
  enabledSlugs: readonly string[];
  openStatus: EventShareStatus | null;
}): { ok: true } | { ok: false; code: EventShareCode };

export function decideUnshareRequest(
  status: EventShareStatus | null,
): { ok: true } | { ok: false; code: "share_not_approved" };

export function decideReview(input: {
  status: EventShareStatus;
  decision: "approve" | "reject";
}): { ok: true; next: EventShareStatus } | { ok: false; code: "share_not_approved" };

export function mergeSharedPublicEvents<T extends { slug: string }>(input: {
  local: readonly T[];
  shared: readonly T[];
}): { rows: T[]; hiddenSlugs: string[] };
```

Open statuses are `pending`, `approved`, and `pending_unshare`.

`decideReview` maps:

| Status | Approve | Reject |
|---|---|---|
| `pending` | `approved` | `rejected` |
| `pending_unshare` | `closed` | `approved` |
| anything else | `share_not_approved` | `share_not_approved` |

`resolveEventDataClient(eventId)` returns `{ ok: true, client, ownerSlug, access: "local" | "guest" }` or `{ ok: false, code: "share_not_approved" }`.

---

### Task 1: Pure grant rules

**Files:**
- Create: `src/lib/events/eventShareGrant.ts`
- Test: `src/__tests__/lib/events/eventShareGrant.test.ts`

- [x] Write the failing tests for `decideShareRequest`, `decideUnshareRequest`, and `decideReview`.
- [x] Run `npx vitest run src/__tests__/lib/events/eventShareGrant.test.ts`. Expect fail.
- [x] Implement the three functions.
- [x] Run the same test. Expect pass.

### Task 2: Pure public merge

**Files:**
- Create: `src/lib/events/mergeSharedPublicEvents.ts`
- Test: `src/__tests__/lib/events/mergeSharedPublicEvents.test.ts`

- [x] A local slug drops the shared row and returns that slug in `hiddenSlugs`.
- [x] Shared rows with a free slug append after local rows.
- [x] The caller already filters archived and unpublished rows. This function does not.

### Task 3: Schema

**Files:**
- Create: `supabase/pulsar-migrations/029_event_share_grants.sql`
- Create: `supabase/migrations/270_event_attendee_entry_host.sql`
- Update: `supabase/migrations/masterdb.sql` with `entry_host_slug` on `event_attendees`

Grant table columns match the spec. Partial unique index on `(owner_slug, owner_event_id, guest_slug)` where status is open. Enable RLS. No anon or authenticated policy. The service role writes the rows.

`entry_host_slug text null` on `public.event_attendees`.

Apply the institute file with `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/270_event_attendee_entry_host.sql`. Apply the Pulsar file with the repo's Pulsar apply command if one exists. If the command is missing, record that in the task note and do not invent a second SQL file.

### Task 4: Grant store

**Files:**
- Create: `src/lib/events/server/eventShareGrantStore.ts`
- Test: `src/__tests__/lib/events/server/eventShareGrantStore.test.ts`

Use `createPulsarAdminClient`. Functions:

- `listOpenGrantsForGuest(guestSlug)`
- `listGrantsForOwnerEvent(ownerSlug, eventId)`
- `listPendingGrants()`
- `insertShareRequest({ ownerSlug, ownerEventId, guestSlug, requestedBy })`
- `setGrantStatus({ id, status, reviewedBy })`
- `closeGrantsForEvent({ ownerSlug, ownerEventId })`

`insertShareRequest` calls `decideShareRequest` before the insert. A unique-index violation returns `share_already_open`. Log failures with `[ge:server]` scope `events.share.store`.

Write `platform_audit_log` inside the review function, not inside every status write. Review actions live in Task 8.

### Task 5: Data client

**Files:**
- Create: `src/lib/events/server/resolveEventDataClient.ts`
- Test: `src/__tests__/lib/events/server/resolveEventDataClient.test.ts`

Steps:

1. Read the current tenant with `resolveRequestTenant`.
2. If `events.id` exists on the current admin client, return `access: "local"`.
3. Else load approved grants for the current slug. If this id is included, build the owner client with `createAdminClientFromCredentials` and `bindInstituteDataPlane` from `getTenantBySlug(ownerSlug)`.
4. Else return `share_not_approved`.

Do not query other owner tables.

### Task 6: Public list, detail, and register

**Files:**
- Modify: `src/lib/dashboard/events/loadPublicEventsList.ts`
- Modify: `src/lib/dashboard/events/loadEventForPublicLanding.ts`
- Modify: `src/lib/events/server/enrollEventAttendeeServer.ts`
- Modify: `src/lib/events/server/prepareEventRegistrationUpload.ts`
- Modify: `src/lib/events/server/uploadEventAttendeeFileServer.ts`
- Modify: `src/lib/events/server/loadEventRegistrationPaymentMethods.ts`
- Modify: `src/lib/events/server/reconcileEventGatewayPaymentReturn.ts`
- Tests beside the existing files

The guest list loads local rows, then approved shared events that are published and not archived, then `mergeSharedPublicEvents`. Detail and register resolve the client by slug, then by id. Enroll sets `entry_host_slug` to the guest slug when `access` is `guest`, otherwise null.

Home loaders stay on the current client. Do not call the shared merge there.

### Task 7: Mail brand

**Files:**
- Create: `src/lib/events/server/eventShareMailBrand.ts`
- Modify: `src/lib/events/server/loadResolvedEventEmail.ts`
- Modify: `src/lib/events/server/sendEventAttendeeNotification.ts`
- Test: `src/__tests__/lib/events/server/eventShareMailBrand.test.ts`

`resolveEventMailTenant(entryHostSlug)` returns the entry tenant when the slug is set, else the request tenant. Event template rows are read with the owner data client. Institute `email_templates` and the brand wrapper are read from the entry tenant.

### Task 8: Admin mutations and archive

**Files:**
- Modify: `src/app/[locale]/dashboard/admin/events/eventActionsShared.ts`
- Modify: every admin event action that calls `createAdminClient()` for an existing event id
- Modify: `src/lib/events/server/duplicateEventServer.ts`

`requireEventDataClient(eventId)` replaces bare `createAdminClient()` after `requireAdminEventActor()`. Local access stays the same. Guest access requires an approved grant.

`archiveEventAction` writes `archived_at` on the resolved client, then `closeGrantsForEvent`. Duplicate uses the owner client and does not copy grants.

Guest summary does not receive the share control. Pass `access` into the summary model.

### Task 9: Owner share section

**Files:**
- Create: `src/app/[locale]/dashboard/admin/events/eventShareActions.ts`
- Create: `src/components/dashboard/admin/events/AdminEventShareSection.tsx`
- Modify: `src/components/dashboard/admin/events/AdminEventDetailSummaryTab.tsx`
- Test: `src/__tests__/components/AdminEventShareSection.test.tsx`

Show the section only when `access` is `local`. List enabled tenants except the owner. Submit one request per chosen site. Show each grant status. Show `slug_taken` when the guest has a non-archived event with the same slug. Unshare is a button on an `approved` row. Call `router.refresh()` after `{ ok: true }`. Revalidate the admin event path.

Copy keys under `admin.events.share`. Icons on every button. Discriminated errors from Task 1.

### Task 10: CentroListo queue

**Files:**
- Create: `src/app/[locale]/admin/eventShareActions.ts`
- Create: `src/components/organisms/pulsar/PulsarAdminEventShareQueue.tsx`
- Modify: `src/components/organisms/pulsar/PulsarAdminFleetScreen.tsx`
- Modify: `src/app/[locale]/admin/page.tsx`
- Test: `src/__tests__/components/PulsarAdminEventShareQueue.test.tsx`

Add `tab=shares` next to the existing tabs. Use the same `tab` query key. Desktop and narrow both render the queue. Narrow uses a vertical list and 44px targets. Approve and reject call the review action. The action runs `decideReview`, updates the row, and inserts `platform_audit_log` with `tenant_slug` = owner slug and `changed_fields` containing `guest:<slug>` and `event:<id>`. If the owner title read fails, show the event id and `event_title_unavailable`.

### Task 11: Copy, ADR, changelog, checks

**Files:**
- Modify: `src/dictionaries/en.json`, `es.json`, `pt.json`
- Create: `docs/adr/2026-11-10-shared-event-guest-admin.md`
- Create: `supabase/pulsar-migrations/030_shared_events_changelog.sql`
- Test: one known code and one unknown code in the share failure message helper

Sentences name the cause and the next step. The code stays in the sentence.

Run the new Vitest files, `tsc`, and lint on the touched files. Manual QA (user) stays in the spec. Do not run a tenant tour.

Commit only when the user asks, and only if no unrelated WIP is in the tree.
