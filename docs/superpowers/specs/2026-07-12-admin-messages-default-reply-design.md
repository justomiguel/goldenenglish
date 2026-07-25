# Admin messages — institute default reply template

**Date:** 2026-07-12  
**Status:** Approved  
**Related:** Admin portal messages (`portal_messages`), brand layer (`SYSTEM_PROPERTIES_DEFAULTS` + `site_themes`), `site_settings` operational keys (e.g. `bank_transfer_instructions`), ADR `docs/adr/2026-07-12-admin-messages-default-reply-template.md`

## Intent

Give institute admins a **shared default reply template** for the admin Messages module so they can:

1. **Edit** the institute-wide default text (next to “Write message”).
2. **Reply with default** from an inbox/detail row — opens the existing compose screen **pre-filled** with the resolved template so staff can review/edit before sending.

Placeholders `{{instituteName}}` and `{{phone}}` resolve from the **current brand layer** at compose-open time (not baked in at save time).

## Understanding

- Admin inbox (`/{locale}/dashboard/admin/messages`) already has **Write message** and per-row **Reply** → `compose?replyTo={id}`.
- Compose (`AdminPortalCompose`) starts with empty body `<p></p>`; reply bootstrap only sets recipient / external email mode.
- Tenant display name and phone live in the brand layer (`app.name`, `contact.phone` via `loadEffectiveProperties()`).
- Institute-wide operational text already uses `site_settings` (pattern: bank transfer instructions).

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Send behavior | **B** — open compose pre-filled; do **not** send on one click |
| Ownership | **A** — one shared institute template set (not per-admin) |
| Placeholders | **A** — store `{{instituteName}}` / `{{phone}}`; resolve when opening compose |
| Audience | **Admin messages only** (not teacher / parent / student composers) |
| Storage | `site_settings` key `messaging_default_reply_template` |
| Locales | **Templates for `es` / `en` / `pt`**; compose uses the **active site/dashboard locale** (URL `[locale]`), falling back to `defaultLocale` (`es`) then `en` |

## Goals

1. Persist institute default reply templates for **all app locales** (es/en/pt), editable by any admin.
2. Header CTA: **Edit default message** beside **Write message** (edit all locales in one modal).
3. Row (+ detail) CTA: **Reply with default message** → compose with `replyTo` + prefilled body for the **current locale**.
4. Seed / dictionary factory fallbacks per locale when a locale string is missing.
5. Audit on save; dictionary copy for all UI strings; Vitest coverage for resolve + save + CTA wiring.

## Non-goals

- Auto-send / one-click send without compose.
- Per-user personal templates.
- Teacher / parent messaging surfaces.
- Changing brand phone/name from the messages screen (still Site Setup / CMS).
- Bulk “reply with default” for multi-select.
- Auto-translating custom templates when brand language changes.
## Approaches considered

| Option | Verdict |
|--------|---------|
| **`site_settings` + compose prefill** | **Chosen** — matches operational settings; reuses compose/reply bootstrap |
| Theme property on `site_themes` | Rejected — operational copy ≠ brand tokens |
| Dictionary-only fixed template | Rejected — no “edit default” |

## Data contract

### Key

`site_settings.key = 'messaging_default_reply_template'`

### Value (JSONB)

```json
{
  "templates": {
    "es": "Gracias por comunicarte con {{instituteName}}. Nos estaremos comunicando contigo a la brevedad. Para urgencias llamar al {{phone}}.",
    "en": "Thanks for contacting {{instituteName}}. We will get back to you shortly. For emergencies call {{phone}}.",
    "pt": "Obrigado por entrar em contato com {{instituteName}}. Retornaremos em breve. Para urgências, ligue para {{phone}}."
  }
}
```

- Each locale string: plain text, max **2000** characters.
- Allowed placeholders: `{{instituteName}}`, `{{phone}}`. Unknown tokens left unchanged.
- Prefer plain-text storage + HTML escape on resolve.
- **Legacy** `{ "template": "…" }` (single string): treat as the same text for all locales until the admin saves the multi-locale form.

### Fallback (when row or a locale is missing)

Dictionary key `admin.messages.defaultReplyFactoryTemplate` per locale (`en` / `es` / `pt`). Compose picks `templates[locale]` → else `defaultLocale` (`es`) → else `en` → else factory for the requested locale.

### Resolution

Pure helper, e.g. `resolveMessagingDefaultReplyTemplate({ template, instituteName, phone })`:

- Replace `{{instituteName}}` ← `properties["app.name"]`
- Replace `{{phone}}` ← `properties["contact.phone"]` (trimmed)
- Produce HTML suitable for `RichTextEditor` initial value (e.g. wrap escaped text in `<p>`)

## UX

### Messages list header

Next to **Write message**:

- Secondary / outline `Button` or link-styled control with Lucide (`Pencil` / `FilePenLine`): **Edit default message**
- Opens `Modal` (no native dialogs): textarea, helper text listing placeholders, Save / Cancel
- On success: toast or inline saved state + `router.refresh()`; server `revalidatePath` for messages routes

### Inbox row / detail

Beside existing **Reply**:

- Control **Reply with default message** (icon + label; icon-only with `aria-label` on narrow breakpoints if needed)
- Href: `/{locale}/dashboard/admin/messages/compose?replyTo={id}&useDefault=1`
- Same for detail page action strip

### Compose

When `useDefault=1` (and valid reply bootstrap):

- Initial editor body = resolved template HTML
- Recipient / external mode unchanged from existing `replyTo` bootstrap
- If `useDefault=1` without `replyTo`: ignore useDefault (empty compose) or no-op — **ignore**, do not invent a recipient
- Staff can edit freely before Send (existing send path)

## Server surfaces

| Surface | Behavior |
|---------|----------|
| `loadMessagingDefaultReplyTemplate(supabase)` | Read setting or fallback |
| `updateMessagingDefaultReplyTemplateAction` | `assertAdmin`, Zod validate, upsert `site_settings`, `recordSystemAudit`, revalidate |
| Compose page | If `useDefault=1`, load template + `loadEffectiveProperties`, pass `initialBody` into `AdminPortalCompose` |
| RLS | Existing admin write policies on `site_settings` apply; no new table |

ADR: mini note under `docs/adr/` if governance wants an explicit operational-settings addition; otherwise PR “Decisions” section linking this spec is enough for a single `site_settings` key (**prefer short ADR** for discoverability).

## Observability

- `recordSystemAudit`: action `messaging.default_reply_template.update`, `resource_type: site_settings`, `resource_id: messaging_default_reply_template`, payload `{ length }` (no full body if long — or truncated).
- No new `user_events` type required (staff config).

## i18n

All chrome strings in `en.json` + `es.json` (+ `pt.json` if messages namespace is already mirrored there):

- `editDefaultMessageCta`, titles, modal labels, placeholder help, save/error, `replyWithDefaultCta` / titles

Do **not** put institute name/phone into dictionaries.

## Tests (TDD)

1. Pure: resolve placeholders; escape HTML; missing phone/name → empty substitution or fallback string still valid.
2. Load setting: missing row → factory default; present row → stored template.
3. Update action: unauthorized; validation too long / empty; success upsert + audit mock.
4. RTL: header shows edit CTA; card shows reply-with-default link with `useDefault=1`; compose receives `initialBody` when flagged.
5. Tour anchors: if messages tour lists compose CTA, extend inventory only if new always-visible anchors are added (`33-admin-tutorials-contract`).

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| Stale brand in saved text | Placeholders resolve at compose open |
| XSS via template | Plain-text store + escape on resolve; sanitize if HTML allowed later |
| Accidental send of wrong reply | Prefill only; staff confirms in compose |
| Tour staleness | Update L1/L2 if new `data-tour` anchors |

## Definition of done

- [ ] Spec approved; Gate 0 marker written
- [ ] Migration seed (optional INSERT) + load/update helpers + admin action
- [ ] Edit modal + header CTA; row/detail reply-with-default CTA
- [ ] Compose prefill via `useDefault=1`
- [ ] Dictionaries en/es (and pt if required by repo parity)
- [ ] Audit on save; revalidate + refresh
- [ ] Vitest coverage for pure resolve, load/update, UI smoke
- [ ] Manual QA (user): edit template → reply with default → see name/phone → edit body → send

## Out of scope

Teacher/parent templates, auto-send, bulk default reply, per-locale template rows, Site Setup wizard step (may add later).
