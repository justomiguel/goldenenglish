# Nagô registration extras pack

**Date:** 2026-08-25
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- [`2026-08-24-registration-existing-student-and-multi-section-design.md`](2026-08-24-registration-existing-student-and-multi-section-design.md) — shared two-step `RegisterForm`, existing-student lookup, multi-section, accept.
- [`2026-08-08-section-enrollment-link-design.md`](2026-08-08-section-enrollment-link-design.md) — `/i/[token]` uses the same form and the same extras pack.
- [`2026-08-07-event-packages-registrations-contact-student-care-design.md`](2026-08-07-event-packages-registrations-contact-student-care-design.md) — `care_health_note` / `care_diet_note` / `home_address_text` on the student ficha.

**Governing rules:** `28-tenant-register-surface.mdc` (do not fork `RegisterForm`; extras are a composition slot), `09-i18n-copy.mdc`, `04-security.mdc`, `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `03-architecture.mdc` (250-line ceiling).

## Intent

Capoeira Nagô Chile collects a paper *Ficha de Inscripción y Matrícula* plus a *Protocolo de Ingreso y Funcionamiento*. The public `/register` and `/i/[token]` flows already collect the shared identity, tutor-for-minor, and section picks. This spec adds a **Nagô-only extras pack** after those steps: address and school, health and emergency contact, and a versioned protocol acceptance.

Other tenants (classic, Mi Mundo, Liora, Mozarthitos, Espacio Zenit) keep today's form. No shared field is added to their UI.

## Context

`RegisterSurfaceByTemplate` already dispatches a branded shell per `templateKind`. `RegisterForm` is shared and must stay shared. `registrations` has identity, tutor, and section columns. After accept, `profiles` already has `home_address_text` and restricted care notes (`care_health_note`, `care_diet_note`, `care_support_note`). Those profile fields are not asked on the public form today.

The paper ficha always shows an apoderado. The product already collects a tutor **only for minors**. Adults keep email/phone on the shared step and give an **emergency contact** on the Nagô step instead of a forced guardian.

*Fecha de ingreso a Capoeira Nagô* is not asked. It is `registrations.created_at` (or the accept moment on the ficha). No canvas signature and no PDF in this cut.

## Decisions

| Topic | Choice |
|-------|--------|
| Isolation | Pack keyed by `templateKind === "nago"` only. Other tenants never see the step |
| Form | Do not fork `RegisterForm`. Optional `extrasPack` prop + one extra wizard step |
| Storage | `registrations.tenant_extras JSONB NOT NULL DEFAULT '{}'` |
| Server trust | Ignore client pack id. Re-resolve via `loadActiveTheme()` (same source as `/register`) |
| Protocol | Version `"2026-08"`. Store version + signer + server timestamp. Do not store the legal body on the row |
| Signature | Typed signer name + DNI + required checkbox. No canvas |
| Apoderado | Unchanged: minors only, on the shared details step |
| Emergency contact | Always required on the Nagô step. Optional “use tutor data” checkbox is client-only |
| Existing student | Still skip tutor. Still complete the Nagô step (health and protocol can change) |
| Accept mapping | Address and care notes only if the profile fields are blank. Failure does not roll back accept |
| Inbox edit | Extras are read-only on the lead. No editor this cut |
| Export | Nagô columns only when the active theme pack is `nago` |
| CMS / PDF | Out of scope |

## Architecture

### Pack resolution

```ts
type RegistrationExtrasPackId = "nago";

function extrasPackForTemplateKind(kind: string): RegistrationExtrasPackId | null {
  return kind === "nago" ? "nago" : null;
}
```

**Browser:** `RegisterSurfaceByTemplate` computes `extrasPack` from `templateKind` and every surface forwards it to `RegisterForm`. Golden / other surfaces receive `null`.

**Server:** `resolveActiveRegistrationExtrasPack()` calls `loadActiveTheme()` and the same helper. `submitPublicRegistration` and `submitSectionLinkRegistration` both use it.

- Pack is `nago`: extras are required and must pass `buildNagoExtrasSchema`.
- Pack is `null`: extras must be absent or `{}`. Any non-empty extras object is a validation error.
- Client-sent `pack: "nago"` on a non-Nagô tenant is rejected.

### Database — migration `190_registration_tenant_extras.sql`

Additive only. No drops, no rewrite of existing rows.

| Column | Type | Meaning |
|--------|------|---------|
| `tenant_extras` | `JSONB NOT NULL DEFAULT '{}'` | Pack payload, or empty object for tenants / legacy leads |

No GIN index this cut (no inbox filter on extras). `anon` insert already covers new columns. Shape and size are enforced in the app (zod max lengths), not with a JSON CHECK.

Comment on the column: extras for a tenant registration pack; `{}` when the tenant has no pack.

### JSON shape (Nagô, `schemaVersion: 1`)

```ts
{
  pack: "nago",
  schemaVersion: 1,
  nationality: string,             // 1–80
  address: string,                 // 1–200
  commune: string,                 // 1–80
  school: string,                  // 0–120; required when the student is a minor
  healthInsurance: "fonasa" | "isapre" | "other",
  healthInsuranceOther: string,    // 1–80 when other; otherwise ""
  bloodType: "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "unknown",
  hasAllergies: boolean,
  allergiesDetail: string,         // 1–500 when hasAllergies; otherwise ""
  hasMedicalCondition: boolean,
  medicalConditionDetail: string,  // 1–500 when hasMedicalCondition; otherwise ""
  preferredHealthCenter: string,   // 1–160
  emergencyName: string,           // 1–120
  emergencyRelationship: string,   // 1–80
  emergencyPhone: string,          // 1–40
  protocol: {
    version: "2026-08",
    acceptedAt: string,            // ISO timestamptz, server-stamped
    signerName: string,            // 1–120
    signerDni: string              // 1–32
  }
}
```

`buildNagoExtrasSchema({ isMinor: boolean })` enforces the conditionals. The server overwrites `protocol.version` with the current constant `NAGO_PROTOCOL_VERSION = "2026-08"` and `protocol.acceptedAt` with `new Date().toISOString()`. If the client sends a different `protocol.version`, reject (the form was stale).

Unknown keys are stripped before insert.

### Shared helpers

| Piece | Role |
|-------|------|
| `extrasPackForTemplateKind(kind)` | `"nago"` or `null` |
| `resolveActiveRegistrationExtrasPack()` | Server: `loadActiveTheme()` + helper |
| `buildNagoExtrasSchema({ isMinor })` | Zod for the JSON above |
| `parseNagoTenantExtras(raw)` | Narrow a stored JSONB value to the Nagô shape or `null` |
| `formatNagoCareHealthNote(extras, labels)` | Plain text for `care_health_note`; labels from the accept locale dict |
| `formatNagoCareDietNote(extras, labels)` | Plain text for `care_diet_note`; same dict |
| `formatNagoHomeAddress(extras)` | `"{address}, {commune}"` |
| `NAGO_PROTOCOL_VERSION` | `"2026-08"` |
| `nagoProtocolSections(dict)` | Ordered section title + body for the accordion |

### `RegisterForm` — one form, optional fourth step

Do not fork per tenant. If `RegisterForm` exceeds 250 lines, extract the step machine / extras continue, not a `RegisterFormNago`.

Steps stay `student` → (`confirm`) → `details`. When `extrasPack === "nago"`, `details` does **not** submit. The shared contact/sections block shows **Continue**. That continue goes to step `extras`, which renders `RegisterNagoExtras` and the real **Submit**.

When `extrasPack` is `null`, `details` keeps today's Submit. No extras fields in the DOM.

**Nagô extras step (three fieldsets + protocol):**

1. **Student extra** — nationality, address, commune; school required if minor, optional if adult.
2. **Health** — insurance (Fonasa / Isapre / Other + specify), blood type select (eight ABO types + “I don’t know” → `unknown`), allergies yes/no + detail, medical condition yes/no + detail, preferred health center.
3. **Emergency** — name, relationship, phone. If the details step collected a tutor, show “Use the guardian’s data”; checking it copies tutor name, relationship, and phone into the emergency fields (still editable). Not persisted as a flag.
4. **Protocol** — accordion with the eleven functioning rules plus the declaration (copy in `en` / `es` / `pt`, version `2026-08`). Required checkbox “I have read and accept”. Signer name and DNI: prefill from tutor when minor and new; from the student when adult. Existing-student minors have no tutor on the form — signer fields start empty and are required.

Existing-student path: confirm → details (sections only) → extras.

`/register` and `/i/[token]` both get the extras step when the pack is Nagô.

### Submit

`PublicRegistrationInput` gains optional `tenant_extras` (unknown JSON). Both public actions:

1. Existing shared validation (sections, document occupancy, tutor rules for new minors).
2. Resolve pack from `loadActiveTheme()`.
3. If Nagô: parse extras with `isMinor` from the same birth date already used for tutor rules. Stamp protocol version and `acceptedAt`. Insert `tenant_extras` with the object above.
4. If not Nagô: insert `tenant_extras: {}`. Reject a non-empty extras payload.

Do not persist extras on a failed insert. Do not write `section_enrollments` or profile care notes from the public form.

### Admin inbox

`AdminRegistrationRow` gains `tenantExtras: unknown` (the JSONB). `parseNagoTenantExtras` is the only way UI reads it.

`AdminRegistrationExpandedDetails` shows a Nagô block only when parse succeeds: address fields, health summary, emergency, protocol version + signer + accepted-at (locale date). The PWA card that already lists tutor fields shows the same Nagô block. Other tenants unchanged.

`buildRegistrationsExportTable` appends Nagô columns **only** when `extrasPackForTemplateKind(activeTemplateKind) === "nago"` (pass the kind from the export action via `loadActiveTheme()`). Columns: nationality, address, commune, school, insurance, blood type, allergies, medical condition, health center, emergency name / relationship / phone, protocol version, signer name, signer DNI, accepted-at. Empty cell = `labels.emptyValue`. Classic/other tenant exports stay at today's column set.

Lead edit form does not touch `tenant_extras`.

### `acceptRegistration`

After the student exists (created or reused), if `parseNagoTenantExtras(reg.tenant_extras)` is non-null:

1. Read `home_address_text`, `care_health_note`, `care_diet_note` for that student (admin/service client, same privilege as care-note save).
2. If `home_address_text` is blank, set it to `formatNagoHomeAddress(extras)`.
3. If `care_health_note` is blank, set it to `formatNagoCareHealthNote(extras)` (insurance, blood type, condition, health center — each on its own line).
4. If `care_diet_note` is blank, set it to `formatNagoCareDietNote(extras)` (allergies, or the localized “No”).
5. Do not write `care_support_note`. Do not overwrite non-blank notes.
6. If this update errors, log and continue. The lead is still marked enrolled. Staff can copy from the expanded lead.

`has_care_notes` stays trigger-owned (migration 181).

### Protocol copy

Source of truth is the paper protocol supplied for this spec (Escuela de Capoeira Nagô — Mestre Fagulha). Version id: `2026-08`.

Accordion sections, in order:

1. Inscripción y aceptación del protocolo
2. Mensualidad y forma de pago
3. Asistencia y recuperación de clases
4. Congelación de continuidad — pausa temporal
5. Eventos, rodas y actividades especiales
6. Comportamiento y convivencia
7. Salud y responsabilidad
8. Comunicación oficial
9. Suspensión o término de la relación
10. Vestimenta y elementos personales
11. Higiene y cuidado del espacio
12. Declaración y aceptación (closing statement)

Bodies live in dictionaries (`register.nagoProtocol.sections.<id>.title` / `.body`), all three locales. Changing the legal text requires a new version constant and new keys; old leads keep `protocol.version: "2026-08"`.

## Data flow

```
Family — shared steps (unchanged)
  student → confirm? → details (tutor / adult contact + sections)

Nagô only
  → extras (address, health, emergency, protocol)
  → submit
  → server: loadActiveTheme → nago → validate + stamp protocol
  → registrations.tenant_extras = { pack: "nago", ... }

Other tenants
  → submit from details
  → tenant_extras = {}

Admin — accept
  → create or reuse ficha + enroll sections (existing spec)
  → if Nagô extras: fill blank address / care notes
  → extras remain on the lead as evidence
```

## Error handling

| Case | Who sees what |
|------|----------------|
| Nagô, extras missing or invalid | No insert. `register.validationError` (field errors stay on the extras step via native/zod messages) |
| Protocol checkbox off, or signer empty | Cannot submit. Stay on extras |
| Client `protocol.version` ≠ `2026-08` | Validation error (reload / stale tab) |
| Non-Nagô tenant posts extras | Validation error. No insert |
| Other insurance / allergies / condition without detail | Validation error |
| Adult with empty school | Allowed |
| Minor with empty school | Validation error |
| Closed inscriptions / dead token / occupied DNI | Existing messages |
| Accept care/address update fails | Accept succeeds. Log. Lead still shows extras |

## Testing

**Vitest**

- `extrasPackForTemplateKind`: `nago` → `"nago"`; every other `SITE_THEME_KINDS` value → `null`.
- `buildNagoExtrasSchema`: happy path; minor requires school; adult allows empty school; `other` / allergies / condition require detail; reject wrong protocol version.
- Submit: Nagô + valid extras persists JSON with server-stamped `acceptedAt` and `version`. Non-Nagô + extras → error. Non-Nagô + `{}` → today's insert, `tenant_extras` empty. Section-link action uses the same pack gate.
- Accept: blank profile fields receive formatted notes/address. Non-blank notes are unchanged. Mapping error does not fail accept.
- `RegisterForm`: no extras step when `extrasPack` is omitted/`null`. Nagô: details Continue, then extras Submit. Existing student still reaches extras.
- `AdminRegistrationExpandedDetails` + export: Nagô block/columns only for the Nagô pack; other tenants unchanged.
- Dictionaries `en` / `es` / `pt`: `register.nagoPack.*` and `register.nagoProtocol.*` present and aligned.
- Migration 190 adds `tenant_extras` with default `{}`.

**End-to-end**

No new Playwright against the Nagô deploy database. Isolated E2E stays on the classic/e2e tenant (no extras step). Coverage for the pack is Vitest + the existing critical registration specs remain green.

## Non-goals

- Forking `RegisterForm` or a Nagô-only submit action.
- Adding nationality / address / health to classic or other tenant forms.
- Canvas signature, printable PDF, or CMS-editable protocol.
- Asking *fecha de ingreso* on the form.
- Forcing an apoderado on adults.
- Editing `tenant_extras` on the admin lead edit form.
- Overwriting existing care notes or address on accept.
- Writing care notes from the anonymous insert.
- Filtering the inbox by extras.
- Rate limit / captcha (same as the existing public form).

## Consequences

- `RegisterForm` needs a fourth step and a Continue-vs-Submit split on the details block; extract if the file crosses 250 lines.
- Every `Register*Surface` gains one forwarded prop (`extrasPack`). That is plumbing, not a form fork.
- Health data sits on the lead (admin-readable) until accept copies it into restricted care notes. Same visibility as today’s tutor phone on the lead.
- A protocol text change is a version bump; families who already accepted `2026-08` are not asked again unless they submit a new lead.

## Done when

- On a Nagô theme, `/register` and `/i/[token]` show the extras step after sections, with the fields and protocol above, and persist `tenant_extras` as specified.
- On any other theme, the extras step is absent, submit still writes `{}`, and a spoofed extras payload is rejected.
- Existing-student Nagô leads skip tutor, still complete extras + protocol.
- Inbox expanded row and Nagô export show the pack; other tenant exports are unchanged.
- Accept fills blank address and care notes only; protocol evidence stays on the lead.
- `en` / `es` / `pt` aligned. Tests above green.
