# Admin email send toggles

**Date:** 2026-08-24
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`docs/adr/2026-04-communications-email-templates.md`](../../adr/2026-04-communications-email-templates.md) — registry keys are the catalog of product emails; `sendBrandedEmail` is the single outbound path for those keys.
- Admin Settings already has one email kill-switch: `class_reminders_enabled` on `/[locale]/dashboard/admin/settings`.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc` (`assertAdmin`, no client mutations), `08-analytics-observability.mdc` (audit setting changes), `09-i18n-copy.mdc` (admin copy in dictionaries), `12-supabase-app-boundaries.mdc` (Supabase only in `src/lib/supabase/`).

## Intent

An institute admin can turn **each product email** on or off from Admin → Settings, and see **today’s value** on the same row (`Hoy: se está enviando` / `Hoy: no se envía`). Default stays **on** so current tenants keep sending until someone flips a switch.

Password-reset mail stays always on. Event attendee mail and site-contact visitor replies stay always on (they do not use the template registry).

## Context

Today only class reminders have a yes/no (`site_settings.class_reminders_enabled`). Everything else that goes through `sendBrandedEmail` always sends. Churn inactivity (`churn.inactivity`) is a daily cron with no setting. The Communications → Templates screen edits copy and is mega-admin only; it is not a kill-switch.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | All registry product emails (16 keys). Not password reset, admin reset notice, events, site-contact visitor reply |
| Storage | One `site_settings` key `email_sends_enabled`: JSON object `{ [templateKey]: boolean }` |
| Missing key | Treat as **on** (current behavior) |
| Class reminders | Same list row as the others. Toggle **dual-writes** `email_sends_enabled["notifications.class_reminder_prep"]` and `class_reminders_enabled` so `syncClassReminderJobs` keeps working |
| Class reminders extras | Minutes + timezone stay on the existing form; **remove** that form’s enable checkbox |
| Gate | `sendBrandedEmail` checks the map before Resend. In-app / WhatsApp unchanged |
| Save UX | Per-row, immediate (same as Inscripciones). Failed save reverts the checkbox |
| Manual send while off | Retention / overdue reminder: tell the admin the email is **disabled**, not that send failed |
| Churn while off | Cron does not send and does **not** set `churn_notified_at` |
| Public RLS | Do **not** add this key to `site_settings_select_public` |
| Migration | None. `site_settings` already stores arbitrary keys. Missing row = all on |

## Catalog (16 rows)

Source of labels and grouping: `listEmailTemplateDefinitions()` in `src/lib/email/templates/templateRegistry.ts`. Do not hardcode a second list of keys in the UI.

| Group | Key | Admin label (es) |
|-------|-----|------------------|
| Automáticos | `churn.inactivity` | Recordatorios de no ingreso |
| Automáticos | `notifications.class_reminder_prep` | Recordatorios de clase |
| Facturación | `billing.receipt_submitted_pending` | Comprobante recibido (pendiente) |
| Facturación | `billing.monthly_payment_approved` | Pago aprobado |
| Facturación | `billing.monthly_payment_rejected` | Pago rechazado |
| Facturación | `billing.admin_recorded_monthly_paid` | Pago registrado por administración |
| Facturación | `billing.overdue_balance_reminder` | Recordatorio de saldo vencido |
| Facturación | `billing.enrollment_exemption` | Exención de matrícula |
| Facturación | `billing.promotion_applied` | Promoción aplicada |
| Académico | `academics.transfer_approved` | Traslado aprobado |
| Académico | `academics.grade_published_parent` | Calificación publicada (tutores) |
| Académico | `academics.retention_contact` | Contacto retención |
| Mensajería | `messaging.teacher_new` | Nuevo mensaje al profesor |
| Mensajería | `messaging.staff_portal_new` | Nuevo mensaje al portal |
| Mensajería | `messaging.reply` | Respuesta del profesor |
| Otros avisos | `notifications.ward_email_changed` | Cambio de email del alumno |

UI group headings are dictionary copy. Row titles: dictionary overrides for the two Automáticos rows (friendlier names above); every other row uses `definition.label` for the active locale. Keys stay the registry keys.

A new registry key appears in the list automatically. There is no extra yes/no for emails that never call `sendBrandedEmail`.

## Architecture

### Persistence

`site_settings` row:

```
key   = 'email_sends_enabled'
value = { "churn.inactivity": true, "billing.overdue_balance_reminder": false }
```

Only store keys the admin has touched. Absent key ⇒ enabled.

Parser (pure): `parseEmailSendsEnabled(value) → Record<string, boolean>`. Ignore non-boolean entries. Unknown keys in the JSON are kept (so a removed template does not explode) but are not shown.

Read helper (server): `loadEmailSendsEnabled(supabase)` → map. Used by Settings page and by the send gate.

Enabled check (pure): `isEmailSendEnabled(map, templateKey) → boolean` — `map[key] !== false`.

Class reminders already have `class_reminders_enabled`. Tenants may have that flag off and no map row yet. One composed helper used by **both** the Settings list and the send gate:

`isProductEmailEnabled({ map, classRemindersEnabled, templateKey })`

- `notifications.class_reminder_prep`: `classRemindersEnabled === true && map[key] !== false`. Pass the **parsed** `remindersEnabled` from `parseClassReminderSiteSettings` (missing `class_reminders_enabled` is **false** today). Settings, `sendBrandedEmail`, and job sync then agree.
- any other key: `map[key] !== false` (missing map key is **on**).

Toggle of `notifications.class_reminder_prep` writes **both** `email_sends_enabled[key]` and `class_reminders_enabled` to the same boolean so they cannot drift.

### Send gate

`sendBrandedEmail` result becomes:

```
| { ok: true; fromOverride: boolean }
| { ok: true; skipped: true }
| { ok: false; error: string }
```

If `isProductEmailEnabled` is false: return `{ ok: true, skipped: true }` **before** `emailProvider.sendEmail`. Do not call Resend.

Callers that treat `!send.ok` as a user-visible failure must also handle `skipped`:

- `retentionEmailActions`: new code `DISABLED`. Copy: this email is turned off in Settings.
- `overdueBalanceRemindersAction`: count as `skipped` (already has that bucket).
- Automated emitters (messaging, billing notices, grades, transfers, ward email, class-reminder email handler, churn): ignore skip; do not surface an error.

### Churn cron

`src/app/api/cron/churn-inactivity/route.ts`:

1. Load the map (admin client).
2. If `churn.inactivity` is off, return `{ ok: true, notified: 0 }` and **do not** update `churn_notified_at`.
3. If on, keep today’s batch + stamp behavior.

### Admin UI

Route: existing `src/app/[locale]/dashboard/admin/settings/page.tsx`.

New card **Envíos de email** (between Inscripciones and Recordatorios de clase):

- Lead: turn each automatic email on or off. The text on the right is today’s value.
- Groups as in the catalog table.
- Each row: checkbox, label, status text `Hoy: se está enviando` | `Hoy: no se envía`.
- Toggle calls `setEmailSendEnabledAction({ locale, templateKey, enabled })`.
- Tour anchor: `admin-settings-email-sends` (add to `ADMIN_TOUR_ANCHORS`).

`ClassRemindersAdminSettingsForm`: drop the enable checkbox; keep minutes + timezone + save.

### Server action

`setEmailSendEnabledAction` in `src/app/[locale]/dashboard/admin/settings/actions.ts` (or a sibling file if that file hits 250 lines):

1. `assertAdmin()`.
2. Reject if `templateKey` is not `isKnownEmailTemplateKey`.
3. Read current map, set `map[templateKey] = enabled`, upsert `email_sends_enabled`.
4. If `templateKey === "notifications.class_reminder_prep"`, also upsert `class_reminders_enabled = enabled`.
5. `recordSystemAudit` with `{ templateKey, enabled }` (no full map dump).
6. `revalidatePath` Settings.

### Always-on (out of this list)

These keep sending with no toggle:

- `sendPasswordResetEmail`
- `sendAdminPasswordResetNoticeEmail`
- `notifyAttendeeViaResend` (events)
- `sendAdminSiteContactVisitorReplyEmail`

## Error handling

| Case | Behavior |
|------|----------|
| Not admin | Action returns `{ ok: false }`. Checkbox reverts |
| Unknown template key | `{ ok: false }`. No write |
| Upsert error | `{ ok: false }`. Checkbox reverts. Existing log helper |
| Send while disabled (manual) | `DISABLED` / skipped count, not `EMAIL_FAILED` |
| Send while disabled (auto) | Silent skip |

## Testing

- `parseEmailSendsEnabled` / `isEmailSendEnabled`: missing, empty, explicit `true`/`false`, junk values ignored.
- `sendBrandedEmail`: when map says false for that key, `sendEmail` is not called and result is `{ ok: true, skipped: true }`; when missing/true, still sends.
- `setEmailSendEnabledAction`: non-admin denied; unknown key denied; known key upserts map; class-reminder key dual-writes `class_reminders_enabled`.
- Churn cron: disabled ⇒ `notified: 0` and no `churn_notified_at` update.
- Retention action: skipped send ⇒ `DISABLED`, not `EMAIL_FAILED`.
- `EmailSendsAdminSettingsForm`: renders current on/off text from props; toggling calls the action.

No new e2e required; Settings already has inscriptions + class-reminder coverage patterns if a smoke wants one toggle.

## Out of scope

- Editing email copy (already on Communications → Templates).
- Per-user or per-role mute.
- WhatsApp / push / in-app kill-switches (except the class-reminder job cluster already gated by `class_reminders_enabled`).
- Toggles for password reset, events, or site-contact visitor replies.
- Changing the 7-day churn threshold.
- Site Setup wizard fields for these flags.

## Risks

- Dual-write drift on class reminders if a future change writes only one key. Mitigate: loader prefers `class_reminders_enabled` for that row; toggle always writes both.
- Returning `{ ok: true, skipped: true }` could hide a disabled send from an admin who clicked “send email”. Mitigate: retention and overdue paths handle `skipped` explicitly.
- Stamping `churn_notified_at` while disabled would permanently silence families. Mitigate: cron exits before the loop when off.
