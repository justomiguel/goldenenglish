# ADR: Class reminders and WhatsApp (Meta Cloud API)

## Context

Automated class reminders send preparation email and urgent in-app / WhatsApp notifications. WhatsApp requires approved transactional templates and server-side credentials.

## Decision

- Use **Meta WhatsApp Cloud API** (`graph.facebook.com`) with server-only env vars: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_CLASS_REMINDER_TEMPLATE_NAME`.
- Template language defaults to **es**; body parameters are ordered strings `[firstName, sectionLabel, locationOrOnline]` built in [`src/lib/notifications/processClassReminderJob.ts`](../../src/lib/notifications/processClassReminderJob.ts).
- If env vars are missing, dispatch marks jobs with `whatsapp_not_configured` and skips sending without crashing cron.

## Options considered

- **Third-party CPaaS** (Twilio, MessageBird): extra vendor and cost; deferred unless Meta onboarding blocks production.
- **Manual staff sends**: rejected — does not scale and conflicts with automated motor.

## Consequences

- Operations must create and approve a Meta template matching parameter count/order; document template name in deployment secrets.
- Invalid phone numbers surface via `class_reminder_channel_prefs.whatsapp_last_error_code` and the portal prefs UI.
- **Follow-up:** Web Push subscriptions and “push read suppresses WhatsApp” are out of this ADR (post–Phase 1.1).
