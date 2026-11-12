# Shared events across institutes

**Intent:** An institute admin can ask to share one event with other institutes. The CentroListo operator approves each site. The event row stays in the owner database. Guest sites show it with their own look. Both admins manage that same row.

**Done when:**

- The owner summary can request a share or an unshare for one or more other sites.
- CentroListo shows a queue and can approve or reject each row.
- An approved guest lists the event on `/events`, the detail page, and registration. The page chrome is the guest brand.
- A purchase, a receipt upload, and every admin change write to the owner database.
- The payment account is the owner account.
- Mail uses the brand of the site where the person registered.
- Archiving the event hides it on every guest and closes the share rows.
- Tests cover the resolver, the public merge, archive, and the CentroListo decision.

**Out of scope:** Sharing sections, students, payments, or any entity other than events. A share request started by the guest. A hard delete of the event row. A second copy of the event in the guest database. The guest home popup is specified in `docs/superpowers/specs/2026-11-11-matiss-shared-popup-and-header-design.md`.

## Decision

One event row lives in the owner database. A row in the CentroListo database grants a guest site access to that id. The guest session never becomes a user in the owner database. The server checks the guest admin, then uses the owner service role for that event id only.

ADR to write with the implementation: `docs/adr/2026-11-10-shared-event-guest-admin.md`. This spec does not replace that ADR.

## Share row

Table: `public.event_share_grants` on the CentroListo database. Add it with a file under `supabase/pulsar-migrations/`.

Columns:

| Column | Meaning |
|---|---|
| `id` | Primary key. |
| `owner_slug` | Institute that owns the event row. |
| `owner_event_id` | `events.id` in the owner database. |
| `guest_slug` | Institute that may show and manage the event. |
| `status` | `pending`, `approved`, `pending_unshare`, `rejected`, or `closed`. |
| `requested_by` | Owner admin user id. This id exists in the owner auth store. |
| `reviewed_by` | CentroListo staff user id. Null until a decision. |
| `reviewed_at` | Time of the last decision. |
| `created_at` | Insert time. |
| `updated_at` | Last status change. |

One open row per (`owner_slug`, `owner_event_id`, `guest_slug`). Open means `pending`, `approved`, or `pending_unshare`. Enforce that with a partial unique index. A `rejected` or `closed` row stays as history. A later request inserts a new row.

Status changes:

1. The owner asks to share. Insert `pending`.
2. CentroListo rejects. Set `rejected`.
3. CentroListo approves. Set `approved`.
4. The owner asks to stop. Set `pending_unshare`. The event stays shared until CentroListo approves the stop.
5. CentroListo rejects the stop. Set `approved` again.
6. CentroListo approves the stop. Set `closed`.
7. Someone archives the event. Set every row for that owner and event id to `closed`.

`share_already_open` when an open row already exists for that guest.

The owner cannot pick `owner_slug` (`share_self`). An unknown slug returns `share_target_unknown`. The site list comes from `platform_tenants`. Disabled sites stay out of the list.

## Entry site

Add `entry_host_slug text null` on `public.event_attendees` in `supabase/migrations/`. Null means the person registered on the owner host.

Set it to the guest slug when the register request host is an approved guest. Later mail for that attendee uses this slug. The column is the source. Do not infer the brand from the admin who clicks approve.

## Who writes where

`resolveEventDataClient(eventId)` returns the Supabase client for that event.

1. If the id exists in the current institute, return the current client.
2. If the current slug is an approved guest for that id, return an owner admin client built with `createAdminClientFromCredentials`.
3. Otherwise the event is missing.

Public reads use the same rule. Guest admin mutations use the same rule after the guest admin check. A missing or closed grant returns `share_not_approved`. A person who is not an admin of the current site returns `share_forbidden`.

The owner service role is used only for that event. That includes the event row, translations, attendees, payments, seats, forms, flows, discount codes, and storage objects for that event, including a new cover or a new receipt. Do not use it to read or write other owner tables. A guest change to `show_on_home` writes the owner column. Only the owner home reads that flag.

Payment settings, the payment provider, and receipt storage stay on the owner database. The guest brand does not replace the owner payment account.

## Mail

For `events.registered`, `events.payment_approved`, `events.payment_rejected`, `events.reminder`, and `events.registration_removed`:

- Read `entry_host_slug` on the attendee.
- Load the brand and the `email_templates` override from that institute.
- If the slug is null, use the owner brand and the owner templates.
- Send through the existing branded mail path. Pass the resolved brand and template in. Do not call `getBrandForRequest()` for these messages when the actor host and the entry host differ.

There is no Matiss-only event template in code. The frame is the institute logo and name. The body is the shared event template, or the override stored in that institute database.

## Screens

### Owner summary

Tier B. Desktop only. The control sits on the event summary tab, next to the publish bar. The form starts closed. A button with the share title opens it.

The owner admin turns on share and picks one or more other sites. Each site creates or reuses the grant row as defined above. The summary lists each grant with its status. `slug_taken` appears on a grant when the guest already has a non-archived event with the same slug. The owner can request an unshare for an `approved` grant.

The guest summary does not show this control.

### Guest public site

The guest `/events` list appends each approved owner event that is published and not archived. Order stays by event date. The guest detail URL is `/{locale}/events/{ownerSlug}`.

If the guest has a non-archived event with that slug, the local event wins. Omit the shared event from the list. Do not replace the local detail page. The owner summary shows `slug_taken` for that grant.

The detail page and the register page use the guest chrome, logo, and document title. The event fields come from the owner row. Registration writes the attendee in the owner database and sets `entry_host_slug` to the guest slug.

`show_on_home` on the owner row also opens the guest home popup. See `docs/superpowers/specs/2026-11-11-matiss-shared-popup-and-header-design.md`.

### Guest admin

The guest event list includes approved shared events. Each row names the owner site. Open, edit, publish, price, attendees, payments, seat map, and archive use `resolveEventDataClient`. Archive is allowed for the guest admin and for the owner admin. Archive sets `archived_at` on the owner row and closes every grant for that event.

Duplicate creates a new event in the owner database. It does not copy share grants. The guest does not receive a local row.

### CentroListo queue

Add a `shares` tab on the fleet admin (`src/app/[locale]/admin/page.tsx`, `PulsarAdminFleetScreen`). The tab query key stays `tab`. The frame already has a desktop tree and a narrow tree (`PulsarPanelFrame`).

Each queue row shows the owner site, the event title, the guest site, and the pending action (share or unshare). Load the title from the owner database. If that read fails, show the event id and the code `event_title_unavailable`. Approve and reject are buttons with a leading icon.

On the narrow tree, render a vertical list. Each action target is at least 44px. Do not ship a wide table as the only control.

Write `platform_audit_log` for each decision. `tenant_slug` is the owner slug. `action` is `event_share_approve`, `event_share_reject`, `event_unshare_approve`, or `event_unshare_reject`. Put the guest slug and the event id in `changed_fields`.

## Archive

`archiveEventAction` writes `archived_at` through `resolveEventDataClient`. Then it closes every `event_share_grants` row for that owner slug and event id. Public queries already skip archived events, so every guest loses the event on the next read. Attendee rows stay in the owner database.

## Audit on the owner database

`system_config_audit.actor_id` references `profiles`. A guest admin id is not a profile in the owner database. Insert the owner audit row with the service role, `actor_id` null, and payload `guest_slug` plus `guest_actor_id`. Keep the same `action` and `resource_type` the owner admin path already writes. Also log `[ge:server]` with scope `events.shared.write`, the event id, the guest slug, and the result code.

CentroListo decisions stay in `platform_audit_log`. Do not copy those decisions into an institute audit table.

## Errors

Each code has its own sentence in `en.json`, `es.json`, and `pt.json`. The sentence names the cause and the next step. The code stays visible. Spanish uses neutral tuteo.

| Code | When |
|---|---|
| `share_self` | The chosen site is the owner. |
| `share_target_unknown` | The slug is not an enabled tenant. |
| `share_already_open` | An open grant already exists for that guest. |
| `slug_taken` | The guest has a local event with the same slug. The grant can still be approved. The public guest page keeps the local event. |
| `share_not_approved` | A write targets an event the current site cannot manage. |
| `share_forbidden` | The current user is not an admin of the current site. |
| `event_title_unavailable` | CentroListo could not read the event title from the owner database. |
| `share_store_failed` | The grant row could not be saved. The person can try again. |

Unknown codes stay visible. Do not replace them with one generic sentence.

## Surfaces (Web vs PWA)

| Surface | Tier | This change |
|---|---|---|
| Event summary and event admin | Tier B. No PWA tree. | Share control and guest event management stay on the desktop admin. |
| Public event list and detail | Public. One server page. No separate PWA tree. | The same loader feeds the page. Guest chrome comes from the request host. |
| Event registration | Tier A. `EventRegisterSurfaceEntry` switches `EventRegisterDesktop` and `EventRegisterPwa`. | Both trees receive the same owner event payload. Do not add a second fetch inside the PWA tree. |
| CentroListo fleet | Staff. `PulsarPanelFrame` already has desktop and narrow. | The `shares` tab must be usable in both trees. |

Shared hooks and actions keep their current props. The data client changes inside the server resolver. The PWA register tree must keep working for a normal local event.

## Tests

| Test | Lock |
|---|---|
| Resolver | Current-tenant id uses the current client. Approved guest id uses the owner client. A closed grant returns `share_not_approved`. |
| Public merge | Guest list contains local published events plus approved shared events. A local slug hides the shared event. Archived owner events are absent. |
| Entry host | A guest registration stores `entry_host_slug`. Approval mail resolves that brand, not the admin host brand. |
| Archive | Archive from a guest admin sets `archived_at` on the owner row and closes the grants. |
| CentroListo | Approve sets `approved`. Reject sets `rejected`. Unshare approve sets `closed`. |
| Errors | A known code renders its sentence. An unknown code stays in the message. |

Manual QA (user): open the Liora gala from Matiss after a grant is approved. Register on Matiss. Approve the payment as the Matiss admin and as the Liora admin. Confirm the mail brand follows the entry site and the payment lands in Liora.

## Analytics

Do not add a `user_events` type. Staff changes use `platform_audit_log` and `system_config_audit` as written above. A public registration keeps the existing event enrollment events on the owner database. Metadata may include `entry_host_slug`. Do not put the attendee email in that metadata.
