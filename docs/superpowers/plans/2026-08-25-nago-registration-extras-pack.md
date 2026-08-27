# Nagô Registration Extras Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a Nagô theme only, `/register` and `/i/[token]` collect address, health, emergency contact, and a versioned protocol acceptance after the shared steps, persist it on the lead, show it in the inbox/export, and copy blank ficha address/care notes on accept.

**Architecture:** Additive `registrations.tenant_extras` JSONB. Pack id from `templateKind === "nago"` via `extrasPackForTemplateKind`. Shared `RegisterForm` gets an optional fourth step; the server re-resolves the pack with `loadActiveTheme()` and never trusts a client pack id. Accept maps extras onto blank `home_address_text` / care notes only.

**Tech Stack:** Next.js App Router, Zod, Supabase Postgres, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-nago-registration-extras-pack-design.md`

## Global Constraints

- Spec authority: that file. Do not fork `RegisterForm` (rule `28-tenant-register-surface.mdc`).
- i18n `en` / `es` / `pt` same key shape (rule `09-i18n-copy.mdc`).
- Supabase only via `src/lib/supabase/` (rule `12-supabase-app-boundaries.mdc`).
- Migrations additive only (rule `21-migrations-production-no-data-destruction.mdc`).
- Files ≤ 250 lines (rule `03-architecture.mdc`).
- Tests under `src/__tests__/` are self-contained (rule `30-harness-self-contained-tests.mdc`).
- Commits: only when the user asks. Each task ends with `npx vitest run <paths>`. Do not `git commit` unless asked.
- Commands: `npx vitest run <path>`, `npx tsc --noEmit`.
- Protocol version constant is exactly `"2026-08"`. Pack id is exactly `"nago"`.

## File map

| Path | Role |
|------|------|
| `src/lib/register/packs/extrasPackForTemplateKind.ts` | `"nago"` or `null` from `templateKind` |
| `src/lib/register/packs/resolveActiveRegistrationExtrasPack.ts` | Server: `loadActiveTheme()` + helper |
| `src/lib/register/packs/nago/protocolVersion.ts` | `NAGO_PROTOCOL_VERSION` |
| `src/lib/register/packs/nago/types.ts` | `NagoTenantExtras` |
| `src/lib/register/packs/nago/schema.ts` | `buildNagoExtrasSchema` |
| `src/lib/register/packs/nago/parseNagoTenantExtras.ts` | Narrow stored JSONB |
| `src/lib/register/packs/nago/formatNagoFichaFields.ts` | Address + care-note formatters |
| `src/lib/register/packs/nago/nagoProtocolSections.ts` | Ordered accordion ids |
| `src/lib/register/packs/resolveAndStampTenantExtras.ts` | Server gate used by both public actions |
| `supabase/migrations/190_registration_tenant_extras.sql` | JSONB column |
| `src/components/register/RegisterNagoExtras.tsx` | Extras step UI |
| `src/components/register/RegisterNagoProtocol.tsx` | Accordion + accept + signer |
| `src/components/dashboard/AdminRegistrationNagoExtras.tsx` | Inbox / PWA extras block |

---

### Task 1: Pack helpers — resolve, schema, parse, format

Pure modules. No React, no DB.

**Files:**
- Create: `src/lib/register/packs/extrasPackForTemplateKind.ts`
- Create: `src/lib/register/packs/nago/protocolVersion.ts`
- Create: `src/lib/register/packs/nago/types.ts`
- Create: `src/lib/register/packs/nago/schema.ts`
- Create: `src/lib/register/packs/nago/parseNagoTenantExtras.ts`
- Create: `src/lib/register/packs/nago/formatNagoFichaFields.ts`
- Create: `src/lib/register/packs/nago/nagoProtocolSections.ts`
- Test: `src/__tests__/lib/register/packs/extrasPackForTemplateKind.test.ts`
- Test: `src/__tests__/lib/register/packs/nagoExtrasSchema.test.ts`
- Test: `src/__tests__/lib/register/packs/parseNagoTenantExtras.test.ts`
- Test: `src/__tests__/lib/register/packs/formatNagoFichaFields.test.ts`

**Interfaces:**
- Consumes: `SITE_THEME_KINDS` from `@/types/theming`, `z` from `zod`.
- Produces:
  - `export type RegistrationExtrasPackId = "nago"`
  - `export function extrasPackForTemplateKind(kind: string): RegistrationExtrasPackId | null`
  - `export const NAGO_PROTOCOL_VERSION = "2026-08"`
  - `export const NAGO_EXTRAS_SCHEMA_VERSION = 1`
  - `export type NagoBloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "unknown"`
  - `export type NagoHealthInsurance = "fonasa" | "isapre" | "other"`
  - `export type NagoTenantExtras` — exact JSON shape from the spec (`pack`, `schemaVersion`, student extra, health, emergency, `protocol`)
  - `export function buildNagoExtrasSchema(options: { isMinor: boolean }): z.ZodType<NagoTenantExtras>`
  - `export function parseNagoTenantExtras(raw: unknown): NagoTenantExtras | null`
  - `export type NagoCareNoteLabels = { insurance: string; bloodType: string; condition: string; healthCenter: string; allergies: string; none: string }`
  - `export function formatNagoHomeAddress(extras: NagoTenantExtras): string` → `` `${address}, ${commune}` ``
  - `export function formatNagoCareHealthNote(extras: NagoTenantExtras, labels: NagoCareNoteLabels): string` — four lines: insurance (use `healthInsuranceOther` when `other`), blood type, condition (detail or `labels.none`), health center
  - `export function formatNagoCareDietNote(extras: NagoTenantExtras, labels: NagoCareNoteLabels): string` — allergies detail or `labels.none`
  - `export const NAGO_PROTOCOL_SECTION_IDS` — `["inscription", "tuition", "attendance", "freeze", "events", "conduct", "health", "communication", "termination", "attire", "hygiene", "declaration"] as const`

**Schema rules:**
- `pack` literal `"nago"`, `schemaVersion` literal `1`.
- `protocol.version` literal `NAGO_PROTOCOL_VERSION` (reject any other string).
- `protocol.acceptedAt` is a non-empty string (client may send a placeholder; the stamp helper overwrites it).
- `school` min 1 when `isMinor`, else allow `""`.
- `healthInsuranceOther` min 1 when insurance is `other`, else `""`.
- `allergiesDetail` min 1 when `hasAllergies`, else `""`.
- `medicalConditionDetail` min 1 when `hasMedicalCondition`, else `""`.
- `.strip()` unknown keys.

**Happy-path fixture** (reuse in later tasks):

```ts
export function validNagoExtras(over: Partial<NagoTenantExtras> = {}): NagoTenantExtras {
  return {
    pack: "nago",
    schemaVersion: 1,
    nationality: "Chilena",
    address: "Av. Principal 100",
    commune: "Santiago",
    school: "Colegio Sur",
    healthInsurance: "fonasa",
    healthInsuranceOther: "",
    bloodType: "O+",
    hasAllergies: false,
    allergiesDetail: "",
    hasMedicalCondition: false,
    medicalConditionDetail: "",
    preferredHealthCenter: "Hospital Sótero del Río",
    emergencyName: "Ana Pérez",
    emergencyRelationship: "Madre",
    emergencyPhone: "+56911111111",
    protocol: {
      version: "2026-08",
      acceptedAt: "2026-08-25T12:00:00.000Z",
      signerName: "Ana Pérez",
      signerDni: "11111111-1",
    },
    ...over,
  };
}
```

Put the fixture in `src/__tests__/lib/register/packs/nagoExtrasFixture.ts`.

- [ ] **Step 1:** Write the four test files. Cover: every `SITE_THEME_KINDS` value except `nago` → `null`; `nago` → `"nago"`; minor requires school; adult allows empty school; `other` / allergies / condition require detail; wrong protocol version fails; `parseNagoTenantExtras` returns null for `{}` / `{pack:"classic"}` / incomplete objects and the fixture for a valid object; formatters join address and emit the labeled lines.

- [ ] **Step 2:** Run — expect FAIL (modules missing).

```bash
npx vitest run src/__tests__/lib/register/packs
```

- [ ] **Step 3:** Implement the modules listed above. Keep each file under 250 lines.

- [ ] **Step 4:** Re-run the same vitest command — expect PASS.

---

### Task 2: Migration 190 + server pack resolve + stamp

**Files:**
- Create: `supabase/migrations/190_registration_tenant_extras.sql`
- Test: `src/__tests__/db/registration_tenant_extras_migration.test.ts`
- Create: `src/lib/register/packs/resolveActiveRegistrationExtrasPack.ts`
- Create: `src/lib/register/packs/resolveAndStampTenantExtras.ts`
- Test: `src/__tests__/lib/register/packs/resolveAndStampTenantExtras.test.ts`

**Interfaces:**
- Consumes: `loadActiveTheme` from `@/lib/theme/loadActiveTheme`, helpers from Task 1, `fullYearsFromIsoDate` is **not** used here (`isMinor` is passed in).
- Produces:
  - SQL: `ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS tenant_extras JSONB NOT NULL DEFAULT '{}'::jsonb;` plus a `COMMENT ON COLUMN` that says extras for a tenant registration pack; `{}` when the tenant has no pack.
  - `export async function resolveActiveRegistrationExtrasPack(): Promise<RegistrationExtrasPackId | null>`
  - `export type StampedTenantExtras = NagoTenantExtras | Record<string, never>`
  - `export async function resolveAndStampTenantExtras(input: { raw: unknown; isMinor: boolean; nowIso: string }): Promise<{ ok: true; extras: StampedTenantExtras } | { ok: false }>`

**`resolveAndStampTenantExtras` rules:**
1. `pack = await resolveActiveRegistrationExtrasPack()`.
2. If `pack === null`: treat missing / `undefined` / `{}` as `{ ok: true, extras: {} }`. Any other value (including `{ pack: "nago", ... }`) → `{ ok: false }`.
3. If `pack === "nago"`: `buildNagoExtrasSchema({ isMinor }).safeParse(raw)`. Fail → `{ ok: false }`. Success → copy the parsed object, set `protocol.version = NAGO_PROTOCOL_VERSION`, set `protocol.acceptedAt = nowIso`, return `{ ok: true, extras }`.

**Tests:**
- Migration file contains `tenant_extras`, `JSONB NOT NULL DEFAULT '{}'::jsonb`, and `COMMENT ON COLUMN`.
- Stamp: mock `resolveActiveRegistrationExtrasPack`. Non-nago + `{}` → empty object. Non-nago + fixture → fail. Nago + fixture → `acceptedAt` equals `nowIso`. Nago + missing extras → fail. Nago + wrong protocol version → fail.

- [ ] **Step 1:** Write the two test files (migration is a SQL string assert, same pattern as `src/__tests__/db/registration_additional_sections_migration.test.ts`).

- [ ] **Step 2:** Run — expect FAIL.

```bash
npx vitest run src/__tests__/db/registration_tenant_extras_migration.test.ts src/__tests__/lib/register/packs/resolveAndStampTenantExtras.test.ts
```

- [ ] **Step 3:** Write the SQL and the two TS modules. `resolveActiveRegistrationExtrasPack` is:

```ts
export async function resolveActiveRegistrationExtrasPack() {
  const snapshot = await loadActiveTheme();
  return extrasPackForTemplateKind(snapshot?.theme.templateKind ?? "classic");
}
```

- [ ] **Step 4:** Re-run — expect PASS.

---

### Task 3: Public submit actions persist extras

**Files:**
- Modify: `src/lib/register/publicRegistrationSchema.ts` — add optional `tenant_extras: z.unknown().optional()`
- Modify: `src/app/[locale]/register/actions.ts` — after shared validation, call `resolveAndStampTenantExtras`; include `tenant_extras: stamped.extras` on insert; if `!stamped.ok` return `reg.validationError`
- Modify: `src/app/[locale]/i/actions.ts` — same insert field and same gate
- Test: `src/__tests__/app/registerActions.test.ts`
- Test: `src/__tests__/app/submitSectionLinkRegistration.test.ts`

**Interfaces:**
- Consumes: `resolveAndStampTenantExtras`, `PublicRegistrationInput.tenant_extras?: unknown`
- Produces: both inserts write `tenant_extras`. Non-Nagô tests keep passing because the stamp helper returns `{}` when pack is null and extras are omitted.

**Test wiring:** mock `@/lib/register/packs/resolveAndStampTenantExtras` (or `resolveActiveRegistrationExtrasPack`) so existing tests stay on the non-nago path (`{ ok: true, extras: {} }`). Add cases:
- Non-nago + fixture extras → `validationError`, insert not called.
- Nago + fixture → insert called with `tenant_extras` whose `protocol.acceptedAt` is a string and `pack === "nago"`.
- Same two cases on `submitSectionLinkRegistration` (reuse the existing token/rpc mocks in that file).

Pass `nowIso` from `new Date().toISOString()` at the call site.

- [ ] **Step 1:** Extend the two action test files with the cases above (mock pack resolve).

- [ ] **Step 2:** Run those tests — expect FAIL (insert has no `tenant_extras`).

```bash
npx vitest run src/__tests__/app/registerActions.test.ts src/__tests__/app/submitSectionLinkRegistration.test.ts
```

- [ ] **Step 3:** Add `tenant_extras` to the zod object (optional unknown). In both actions, after the existing student / section validation succeeds and `isMinor` is known (`age < legal`), call stamp and abort with `validationError` on failure. Add `tenant_extras: stamped.extras` to both `insert` payloads.

- [ ] **Step 4:** Re-run — expect PASS. Existing cases still green.

---

### Task 4: Dictionary keys (en / es / pt)

**Files:**
- Modify: `src/dictionaries/es.json` — under `register`, add `nagoPack` and `nagoProtocol`
- Modify: `src/dictionaries/en.json` — same keys
- Modify: `src/dictionaries/pt.json` — same keys
- Modify: `src/dictionaries/es.json` / `en.json` / `pt.json` — under `admin.registrations`, add `nagoExtrasTitle` plus one label per export column (see Task 6)
- Test: `src/__tests__/i18n/dictionaries.test.ts` — assert `register.nagoPack.stepTitle` and `register.nagoProtocol.sections.declaration.title` exist in all three locales

**`register.nagoPack` keys (all three locales):**

`stepTitle`, `studentExtraTitle`, `nationality`, `address`, `commune`, `school`, `healthTitle`, `healthInsurance`, `healthInsuranceFonasa`, `healthInsuranceIsapre`, `healthInsuranceOther`, `healthInsuranceOtherSpecify`, `bloodType`, `bloodTypeUnknown`, `hasAllergies`, `hasMedicalCondition`, `yes`, `no`, `specify`, `preferredHealthCenter`, `emergencyTitle`, `emergencyName`, `emergencyRelationship`, `emergencyPhone`, `useTutorData`, `careInsurance`, `careBloodType`, `careCondition`, `careHealthCenter`, `careAllergies`, `careNone`

**`register.nagoProtocol` keys:**

`title`, `acceptLabel`, `signerName`, `signerDni`, `sections.inscription|tuition|attendance|freeze|events|conduct|health|communication|termination|attire|hygiene|declaration` each with `title` and `body`.

Spanish bodies are the paper protocol from the spec (Mestre Fagulha / Capoeira Nagô Chile). English and Portuguese are full translations of the same twelve sections, not summaries.

**`admin.registrations` extras labels:**

`nagoExtrasTitle`, `nagoNationality`, `nagoAddress`, `nagoCommune`, `nagoSchool`, `nagoInsurance`, `nagoBloodType`, `nagoAllergies`, `nagoCondition`, `nagoHealthCenter`, `nagoEmergencyName`, `nagoEmergencyRelationship`, `nagoEmergencyPhone`, `nagoProtocolVersion`, `nagoSignerName`, `nagoSignerDni`, `nagoAcceptedAt`

- [ ] **Step 1:** Add the assertion to `dictionaries.test.ts`.

- [ ] **Step 2:** Run — expect FAIL.

```bash
npx vitest run src/__tests__/i18n/dictionaries.test.ts
```

- [ ] **Step 3:** Add the keys to all three JSON files. Keep `nagoProtocol.sections` ids aligned with `NAGO_PROTOCOL_SECTION_IDS`.

- [ ] **Step 4:** Re-run — expect PASS.

---

### Task 5: RegisterForm extras step + surface plumbing

Do not fork `RegisterForm`. If it crosses 250 lines, extract the extras continue handler into `src/components/register/registerFormExtrasContinue.ts` or move the extras step JSX into `RegisterNagoExtras.tsx` only.

**Files:**
- Modify: `src/components/organisms/RegisterSurfaceByTemplate.tsx` — `extrasPack={extrasPackForTemplateKind(templateKind)}` passed through `shellProps`
- Modify: `src/components/organisms/RegisterClassicSurface.tsx` and every other `Register*Surface.tsx` (`Nago`, `MiMundo`, `Liora`, `Mozarthitos`, `EspacioZenit`) — accept `extrasPack?: RegistrationExtrasPackId | null` and forward to `RegisterForm`
- Modify: `src/components/register/RegisterForm.tsx` — `extrasPack?: RegistrationExtrasPackId | null`; step `"extras"`; details Continue when pack is nago
- Modify: `src/components/register/RegisterFormContactAndSections.tsx` — `submitLabel: string` (today's `dict.submit` or `dict.continue`); `submitType: "submit" | "button"`; optional `onContinue?: () => void`
- Create: `src/components/register/RegisterNagoExtras.tsx`
- Create: `src/components/register/RegisterNagoProtocol.tsx`
- Create: `src/lib/register/packs/nago/readNagoExtrasFromFormData.ts`
- Test: `src/__tests__/register/registerForm.test.tsx`
- Test: `src/__tests__/organisms/RegisterSurfaceByTemplate.test.tsx` — nago surface still mounts (existing)

**`RegisterNagoExtras` props:**

```ts
{
  dict: Dictionary["register"];
  isMinor: boolean;
  showUseTutor: boolean;
  tutorPrefill: { name: string; relationship: string; phone: string } | null;
  signerPrefill: { name: string; dni: string };
}
```

Native `name=` fields: `nago_nationality`, `nago_address`, `nago_commune`, `nago_school`, `nago_health_insurance`, `nago_health_insurance_other`, `nago_blood_type`, `nago_has_allergies` (`yes`/`no`), `nago_allergies_detail`, `nago_has_condition`, `nago_condition_detail`, `nago_health_center`, `nago_emergency_name`, `nago_emergency_relationship`, `nago_emergency_phone`, `nago_protocol_accepted` (checkbox), `nago_signer_name`, `nago_signer_dni`, hidden `nago_protocol_version` = `NAGO_PROTOCOL_VERSION`.

`readNagoExtrasFromFormData(fd: FormData): unknown` builds the object `buildNagoExtrasSchema` expects (`hasAllergies` from `"yes"`, `acceptedAt` placeholder `"pending"`, etc.). `RegisterForm.onSubmit` sets `raw.tenant_extras` from this helper when `extrasPack === "nago"`.

**Wizard:**
- `extrasPack !== "nago"`: no extras fields in the DOM; details Submit unchanged.
- `extrasPack === "nago"`: details button is Continue (`type="button"`); click sets step `"extras"` (do not submit). Extras step renders `RegisterNagoExtras` + Submit.
- Existing student + nago: still reaches extras (confirm → details → extras).
- Protocol checkbox `required`. School `required={isMinor}`. Conditional specify inputs `required` when their parent is Other/Yes.

**`RegisterNagoProtocol`:** maps `nagoProtocolSections(dict)` (read `dict.nagoProtocol.sections[id]` for each `NAGO_PROTOCOL_SECTION_IDS` entry) into a `<details>` accordion (first section `open`). Checkbox + signer fields below.

- [ ] **Step 1:** In `registerForm.test.tsx` add: default render has no `nagoPack.stepTitle`; with `extrasPack="nago"` after details Continue the extras title is visible and Submit has not been called; existing-student yes + nago still shows extras title.

- [ ] **Step 2:** Run — expect FAIL.

```bash
npx vitest run src/__tests__/register/registerForm.test.tsx
```

- [ ] **Step 3:** Implement plumbing + extras UI. Prefill signer: new minor → tutor name/dni; adult → student first+last / dni; existing student → empty signer (fields still required).

- [ ] **Step 4:** Re-run form + `RegisterSurfaceByTemplate` tests — expect PASS.

---

### Task 6: Admin inbox, PWA card, export

**Files:**
- Modify: `src/types/adminRegistration.ts` — `tenantExtras: unknown`
- Modify: `src/lib/dashboard/loadPaginatedRegistrations.ts` — add `tenant_extras` to `REGISTRATION_COLUMNS` and map `tenantExtras: r.tenant_extras ?? {}`
- Create: `src/components/dashboard/AdminRegistrationNagoExtras.tsx` — `parseNagoTenantExtras`; if null return null; else a titled `<dl>` of the spec fields (protocol version, signer, accepted-at via `formatCivilIsoDateForDisplay` or `toLocaleString`)
- Modify: `src/components/dashboard/AdminRegistrationExpandedDetails.tsx` — render `<AdminRegistrationNagoExtras>`
- Modify: `src/components/pwa/molecules/AdminRegistrationPwaCard.tsx` — same block where tutor fields already show
- Modify: `src/lib/register/buildRegistrationsExportTable.ts` — third opts field `activeTemplateKind: string`; when `extrasPackForTemplateKind(kind) === "nago"` append the spec columns
- Modify: `src/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction.ts` — `loadActiveTheme()`, pass `templateKind`
- Test: `src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx`
- Test: `src/__tests__/lib/register/buildRegistrationsExportTable.test.ts`
- Test: `src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts` — if the select-column string is asserted, include `tenant_extras`

**Export column order** (after existing headers): nationality, address, commune, school, insurance, blood type, allergies, medical condition, health center, emergency name, relationship, phone, protocol version, signer name, signer DNI, accepted-at.

When pack is not nago, headers stay exactly as today (existing test: header count unchanged).

- [ ] **Step 1:** Write/extend the tests: expanded details hides the Nagô title for `tenantExtras: {}` and shows address when given `validNagoExtras()`; export with `activeTemplateKind: "classic"` keeps current header length; `"nago"` appends the extras headers and cells.

- [ ] **Step 2:** Run — expect FAIL.

```bash
npx vitest run src/__tests__/dashboard/AdminRegistrationExpandedDetails.test.tsx src/__tests__/lib/register/buildRegistrationsExportTable.test.ts
```

- [ ] **Step 3:** Implement mapping, UI block, export opts. Update every `AdminRegistrationRow` fixture in tests that TypeScript flags (`tenantExtras: {}`).

- [ ] **Step 4:** Re-run those tests plus `src/__tests__/lib/dashboard/loadPaginatedRegistrations.test.ts` — expect PASS.

---

### Task 7: Accept maps blank ficha fields

**Files:**
- Create: `src/lib/register/packs/nago/applyNagoExtrasOnAccept.ts`
- Test: `src/__tests__/lib/register/packs/applyNagoExtrasOnAccept.test.ts`
- Modify: `src/app/[locale]/dashboard/admin/registrations/acceptRegistrationAction.ts` — select `tenant_extras`; after the student exists (created or reused) and **before** marking the lead enrolled, call the helper; log failures, do not fail accept
- Test: existing `src/__tests__/app/registrationsActions.test.ts` (or the accept-specific file if that is where accept is mocked) — add one case that the helper is invoked; prefer unit-testing the helper thoroughly and a thin accept integration if the accept test harness already stubs `from("profiles")`

**Interfaces:**
- Consumes: `parseNagoTenantExtras`, formatters, `logSupabaseClientError` / `logServerException`
- Produces:

```ts
export async function applyNagoExtrasOnAccept(input: {
  admin: SupabaseClient;
  studentId: string;
  tenantExtras: unknown;
  labels: NagoCareNoteLabels;
}): Promise<void>
```

Rules:
1. `extras = parseNagoTenantExtras(tenantExtras)`; if null, return.
2. Select `home_address_text, care_health_note, care_diet_note` for `studentId`. If select errors, log and return.
3. Build a patch: each of the three fields is set only when `trim` of the current value is empty.
4. If the patch is empty, return. Else `update` those columns only (never `has_care_notes`, never `care_support_note`).
5. If update errors, log and return.

Accept action labels:

```ts
{
  insurance: dict.register.nagoPack.careInsurance,
  bloodType: dict.register.nagoPack.careBloodType,
  condition: dict.register.nagoPack.careCondition,
  healthCenter: dict.register.nagoPack.careHealthCenter,
  allergies: dict.register.nagoPack.careAllergies,
  none: dict.register.nagoPack.careNone,
}
```

- [ ] **Step 1:** Helper tests: null extras → no update; blank fields → update with formatted strings; non-blank notes → omitted from patch; select error → no throw; update error → no throw.

- [ ] **Step 2:** Run — expect FAIL.

```bash
npx vitest run src/__tests__/lib/register/packs/applyNagoExtrasOnAccept.test.ts
```

- [ ] **Step 3:** Implement helper + call from `acceptRegistration` after `studentId` is known and before the `status: "enrolled"` update. Widen the registration select to include `tenant_extras`.

- [ ] **Step 4:** Re-run helper tests + the existing accept/registration action tests — expect PASS.

```bash
npx vitest run src/__tests__/lib/register/packs/applyNagoExtrasOnAccept.test.ts src/__tests__/app/registrationsActions.test.ts
```

---

## Self-review

**Spec coverage:** pack resolve (T1/T2), JSON shape (T1), migration (T2), both public submits (T3), extras step + no fork (T5), existing student still extras (T5), inbox + PWA + export (T6), accept blank-only mapping (T7), i18n (T4), protocol version stamp (T2/T3). Non-goals (canvas, PDF, CMS, inbox edit, overwrite notes) have no tasks.

**Placeholders:** none.

**Types:** `NagoTenantExtras`, `RegistrationExtrasPackId`, `NagoCareNoteLabels`, `resolveAndStampTenantExtras`, `applyNagoExtrasOnAccept` names are stable across tasks.
