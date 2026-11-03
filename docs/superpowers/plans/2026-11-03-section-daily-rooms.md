# Section Daily rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Ecosistema institute can mark a section in person, hybrid, or remote, and the teacher plus enrolled students join one private Daily room per weekly slot.

**Architecture:** The Daily API key and domain live on the Pulsar institute row. The institute database stores the section mode and one room row per slot. A pure module decides the join window and who is denied. Server actions call Daily. The browser receives only a room URL and a short token.

**Tech Stack:** Next.js App Router, Supabase, Vitest, `@daily-co/daily-js` (call screen only, dynamic import).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-03-section-daily-rooms-design.md`
- ADR: `docs/adr/2026-11-03-section-daily-rooms.md`
- Stay on `main`. Do not create a branch or a worktree.
- Do not commit per task. Commit spec, ADR, plan, and implementation once, in Task 8.
- Do not push.
- `commercial_plan` values are `pagina`, `gestion`, `ecosistema`. Existing institutes default to `gestion`.
- `platform_tenant_owners.plan` stays `free` only.
- `daily_api_key` and `daily_domain` never enter `TenantPublicEnv`.
- Room name is `s` plus 32 hex characters. Privacy is `private`. Knocking is off. The room has no expiry.
- Join window opens 15 minutes before the slot start and closes two hours after the slot end. Timezone is `analytics.timezone`, else `America/Argentina/Cordoba`.
- Token `exp` is the window close, as unix seconds.
- Overlapping windows use the earlier start.
- A section assistant does not receive a token. A parent does not receive a token.
- `is_owner` is true only for `academic_sections.teacher_id`.
- Issue tokens with `POST https://api.daily.co/v1/meeting-tokens`. Do not self-sign.
- Product event type is `action`. Entity is `section:daily_class`. Metadata is `sectionId`, `dayOfWeek`, `startTime`. No token.
- Audit payloads list field names. They do not include the key or the token.
- Visible copy is in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo.
- Files stay at or under 250 lines. Split before crossing that line.
- Before the first edit under `src/`, write `.cursor/sdd-gate0-approved` with `{ "spec": "docs/superpowers/specs/2026-11-03-section-daily-rooms-design.md", "approvedAt": "<ISO>" }`.

---

### Task 1: Pure rules

**Files:**
- Create: `src/lib/pulsar/commercialPlan.ts`
- Create: `src/lib/pulsar/dailyDomain.ts`
- Create: `src/lib/academics/dailyJoinWindow.ts`
- Create: `src/lib/academics/dailyRoomSyncPlan.ts`
- Create: `src/lib/academics/dailyJoinDenial.ts`
- Test: `src/__tests__/lib/pulsar/commercialPlan.test.ts`
- Test: `src/__tests__/lib/pulsar/dailyDomain.test.ts`
- Test: `src/__tests__/lib/academics/dailyJoinWindow.test.ts`
- Test: `src/__tests__/lib/academics/dailyRoomSyncPlan.test.ts`
- Test: `src/__tests__/lib/academics/dailyJoinDenial.test.ts`

**Interfaces:**
- Consumes: `zonedWallTimeToUtc` from `src/lib/admin-digest/closedWeekBounds.ts`
- Produces:
  - `CommercialPlan = "pagina" | "gestion" | "ecosistema"`
  - `parseCommercialPlan(value: unknown): CommercialPlan` — unknown values return `gestion`
  - `parseDailyDomain(value: unknown): string | null` — hostname only, or null
  - `openDailyWindow(input: { now: Date; timeZone: string; slots: { dayOfWeek: number; startTime: string; endTime: string }[] }): { dayOfWeek: number; startTime: string; endTime: string; expUnix: number } | null`
  - `planDailyRoomSync(input: { mode: "in_person" | "hybrid" | "remote"; slots: { dayOfWeek: number; startTime: string }[]; existing: { dayOfWeek: number; startTime: string; dailyRoomName: string }[] }): { create: { dayOfWeek: number; startTime: string }[]; delete: { dayOfWeek: number; startTime: string; dailyRoomName: string }[] }`
  - `denyDailyJoin(input: { plan: CommercialPlan; mode: "in_person" | "hybrid" | "remote"; hasCredentials: boolean; hasRoom: boolean; windowOpen: boolean; role: "teacher" | "student" | "assistant" | "other" }): "plan" | "mode" | "credentials" | "room" | "window" | "person" | null`

- [ ] **Step 1: Write the failing tests**

`commercialPlan.test.ts` asserts `parseCommercialPlan("ecosistema")` is `ecosistema`, and `parseCommercialPlan("free")` and `parseCommercialPlan(null)` are `gestion`.

`dailyDomain.test.ts` asserts `parseDailyDomain(" Academia.Daily.co ")` is `academia.daily.co`, and `parseDailyDomain("https://academia.daily.co/room")` and `parseDailyDomain("")` are null.

`dailyJoinWindow.test.ts` uses timezone `America/Argentina/Cordoba`:

```ts
const slot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };

it("opens 15 minutes before start", () => {
  const now = new Date("2026-11-02T20:45:00.000Z"); // Monday 17:45 in Cordoba (UTC-3)
  const open = openDailyWindow({ now, timeZone: "America/Argentina/Cordoba", slots: [slot] });
  expect(open?.startTime).toBe("18:00");
  expect(open?.expUnix).toBe(Math.floor(new Date("2026-11-03T00:00:00.000Z").getTime() / 1000));
});

it("stays open two hours after the end", () => {
  const now = new Date("2026-11-02T22:30:00.000Z"); // Monday 19:30
  expect(openDailyWindow({ now, timeZone: "America/Argentina/Cordoba", slots: [slot] })?.startTime).toBe("18:00");
});

it("is closed one minute before the window", () => {
  const now = new Date("2026-11-02T20:44:00.000Z"); // Monday 17:44
  expect(openDailyWindow({ now, timeZone: "America/Argentina/Cordoba", slots: [slot] })).toBeNull();
});

it("picks the earlier start when two windows overlap", () => {
  const now = new Date("2026-11-02T21:00:00.000Z"); // Monday 18:00
  const open = openDailyWindow({
    now,
    timeZone: "America/Argentina/Cordoba",
    slots: [
      { dayOfWeek: 1, startTime: "18:10", endTime: "19:00" },
      { dayOfWeek: 1, startTime: "17:50", endTime: "19:30" },
    ],
  });
  expect(open?.startTime).toBe("17:50");
});
```

`dailyRoomSyncPlan.test.ts`:

```ts
it("creates one room per hybrid slot and deletes a removed slot", () => {
  const plan = planDailyRoomSync({
    mode: "hybrid",
    slots: [{ dayOfWeek: 1, startTime: "18:00" }],
    existing: [{ dayOfWeek: 3, startTime: "18:00", dailyRoomName: "s" + "a".repeat(32) }],
  });
  expect(plan.create).toEqual([{ dayOfWeek: 1, startTime: "18:00" }]);
  expect(plan.delete).toEqual([{ dayOfWeek: 3, startTime: "18:00", dailyRoomName: "s" + "a".repeat(32) }]);
});

it("deletes every room when the mode is in person", () => {
  const existing = [{ dayOfWeek: 1, startTime: "18:00", dailyRoomName: "s" + "b".repeat(32) }];
  expect(planDailyRoomSync({ mode: "in_person", slots: [], existing }).delete).toEqual(existing);
  expect(planDailyRoomSync({ mode: "in_person", slots: [], existing }).create).toEqual([]);
});
```

`dailyJoinDenial.test.ts` asserts `denyDailyJoin` returns null for plan `ecosistema`, mode `remote`, credentials, room, open window, and role `teacher` or `student`. It returns `person` for `assistant` and `other`. It returns `plan` for `gestion`, `mode` for `in_person`, `credentials` when `hasCredentials` is false, `room` when `hasRoom` is false, and `window` when `windowOpen` is false. The first failing check in that order wins.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/lib/pulsar/commercialPlan.test.ts src/__tests__/lib/pulsar/dailyDomain.test.ts src/__tests__/lib/academics/dailyJoinWindow.test.ts src/__tests__/lib/academics/dailyRoomSyncPlan.test.ts src/__tests__/lib/academics/dailyJoinDenial.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the modules**

`parseCommercialPlan` returns the value when it is one of the three literals. Every other input returns `gestion`.

`parseDailyDomain` trims and lowercases. It returns null when the string is empty, contains `://`, contains `/`, or contains whitespace. It returns the hostname otherwise.

`openDailyWindow` checks the local dates of yesterday, today, and tomorrow in `timeZone`. For each date whose weekday equals a slot, it builds the window with `zonedWallTimeToUtc`: start minus 15 minutes through end plus 120 minutes. It returns the open window with the earliest start. It returns null when none contain `now`. `expUnix` is `Math.floor(windowEnd.getTime() / 1000)`.

`planDailyRoomSync` compares slots by `dayOfWeek` and `startTime`. In person deletes every existing row and creates nothing. Hybrid and remote create missing slots and delete rows whose key is gone.

`denyDailyJoin` checks in this order: plan, mode, credentials, room, window, person. Teacher and student pass the person check.

- [ ] **Step 4: Run the tests and confirm they pass**

Run the same `npx vitest run` command. Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 2: Pulsar institute fields

**Files:**
- Create: `supabase/pulsar-migrations/012_tenant_commercial_plan_and_daily.sql`
- Modify: `src/lib/tenant/tenantRegistry.ts`
- Modify: `src/lib/tenant/parseTenantConfigJson.ts`
- Modify: `src/lib/tenant/tenantPublicEnv.ts`
- Modify: `src/lib/pulsar/pulsarTenantMapper.ts`
- Modify: `src/lib/pulsar/pulsarTenantSchema.ts`
- Modify: `src/components/organisms/pulsar/PulsarAdminTenantFieldGroups.tsx`
- Modify: `src/components/organisms/pulsar/PulsarAdminTenantLaterFields.tsx`
- Modify: `src/components/organisms/pulsar/pulsarTenantFormDefaults.ts`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/pt.json`
- Modify: `.env.example` inside the documented `TENANTS_CONFIG_JSON` object, with empty Daily fields
- Test: `src/__tests__/lib/tenant/tenantPublicEnv.daily.test.ts`
- Test: extend `src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts` and `src/__tests__/lib/pulsar/pulsarTenantMapper.test.ts`

**Interfaces:**
- Consumes: `parseCommercialPlan`, `parseDailyDomain`
- Produces: `TenantConfig.commercialPlan`, `TenantConfig.dailyApiKey`, `TenantConfig.dailyDomain`

- [ ] **Step 1: Write the failing public-env test**

```ts
import { tenantPublicEnv } from "@/lib/tenant/tenantPublicEnv";
import type { TenantConfig } from "@/lib/tenant/tenantRegistry";

const tenant = {
  slug: "demo",
  hosts: ["demo.localhost"],
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "anon",
  supabaseServiceRoleKey: "service",
  databaseUrl: null,
  brandThemeSlug: null,
  mailTenant: null,
  resendFromEmail: null,
  resendApiKey: null,
  publicUrl: null,
  paymentGatewaySecretEncryptionKey: null,
  whatsappAccessToken: null,
  whatsappPhoneNumberId: null,
  whatsappClassReminderTemplateName: null,
  vapidPublicKey: null,
  vapidPrivateKey: null,
  vapidContactEmail: null,
  googleMapsApiKey: null,
  googleMapsMapId: null,
  kvRestApiUrl: null,
  kvRestApiToken: null,
  debugLogin: false,
  skipInitialSiteSetup: false,
  commercialPlan: "ecosistema",
  dailyApiKey: "daily-secret",
  dailyDomain: "demo.daily.co",
} satisfies TenantConfig;

it("keeps the Daily key and domain off the public env", () => {
  const pub = tenantPublicEnv(tenant);
  expect(JSON.stringify(pub)).not.toContain("daily-secret");
  expect(JSON.stringify(pub)).not.toContain("demo.daily.co");
  expect(pub).not.toHaveProperty("dailyApiKey");
  expect(pub).not.toHaveProperty("dailyDomain");
});
```

Add a schema test: `validatePulsarTenantInput` keeps `commercialPlan: "ecosistema"`, stores a trimmed key, and stores `academia.daily.co` from `Academia.Daily.co`. A value `https://academia.daily.co` fails with `invalid_daily_domain`.

Add a mapper test: a database row with `commercial_plan: "pagina"`, `daily_api_key: "k"`, `daily_domain: "a.daily.co"` maps to those camelCase fields, and `mapPulsarTenantToDbPayload` writes the snake_case columns.

- [ ] **Step 2: Run the new tests and confirm they fail**

Run: `npx vitest run src/__tests__/lib/tenant/tenantPublicEnv.daily.test.ts src/__tests__/lib/pulsar/pulsarTenantSchema.test.ts src/__tests__/lib/pulsar/pulsarTenantMapper.test.ts`

Expected: FAIL on the new fields.

- [ ] **Step 3: Add the migration and the plumbing**

`supabase/pulsar-migrations/012_tenant_commercial_plan_and_daily.sql`:

```sql
alter table public.platform_tenants
  add column if not exists commercial_plan text not null default 'gestion';

alter table public.platform_tenants
  drop constraint if exists platform_tenants_commercial_plan_check;

alter table public.platform_tenants
  add constraint platform_tenants_commercial_plan_check
  check (commercial_plan in ('pagina', 'gestion', 'ecosistema'));

alter table public.platform_tenants
  add column if not exists daily_api_key text;

alter table public.platform_tenants
  add column if not exists daily_domain text;
```

Add the three fields to `TenantConfig`. `parseTenantRow` reads them with `parseCommercialPlan` and `parseDailyDomain`, and `stringField` for the key. Default plan is `gestion` when the JSON omits it.

Add the columns to `PLATFORM_TENANTS_SELECT_COLUMNS`. Map them in `mapDbRowToPulsarTenantRecord` and `mapPulsarTenantToDbPayload`.

In `validatePulsarTenantInput`, set `commercialPlan` from `parseCommercialPlan(raw.commercialPlan)`. Set `dailyApiKey` from `optString`. Set `dailyDomain` from `parseDailyDomain`. If `optString(raw.dailyDomain)` is non-null and `parseDailyDomain` returns null, return `{ ok: false, errorCode: "invalid_daily_domain" }`.

`tenantPublicEnv` does not read the new fields.

Add `commercialPlan`, `dailyApiKey`, and `dailyDomain` to `PulsarTenantFormValues`, the form defaults, and `LATER_FIELDS`. The plan control is a `<select>` with the three values. The key and domain stay text inputs. Labels:

- en: `Plan`, `Daily API key`, `Daily domain`
- es: `Plan`, `Clave API de Daily`, `Dominio de Daily`
- pt: `Plano`, `Chave API do Daily`, `Domínio do Daily`

Option labels: `Página`, `Gestión`, `Ecosistema` in es. `Page`, `Operations`, `Ecosystem` in en. `Página`, `Gestão`, `Ecossistema` in pt.

If `pulsarTenantSchema.ts` would pass 250 lines, move the three-field assembly into `src/lib/pulsar/assembleDailyTenantFields.ts` and call it from the validator.

`savePulsarTenantAction` already writes `platform_audit_log.changed_fields` from `Object.keys(args.payload)`. Keep that line. Do not write the payload values into the audit row. Add `src/__tests__/app/savePulsarTenantAction.audit.test.ts`. Mock `createPulsarAdminClient` the same way `src/__tests__/app/changePulsarStaffPasswordAction.test.ts` does. Save a payload whose `dailyApiKey` is `daily-secret`. Assert the `platform_audit_log` insert has `changed_fields` containing `dailyApiKey`, and assert `JSON.stringify(insertArg)` does not contain `daily-secret`.

Apply this file to the Pulsar database with `psql` and `PULSAR_DATABASE_URL`. Do not run it through `sql:apply-migration:all-tenants`.

- [ ] **Step 4: Run the tests and confirm they pass**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 3: Institute rooms and the Daily client

**Files:**
- Create: `supabase/migrations/240_section_delivery_mode_and_daily_rooms.sql`
- Modify: `supabase/migrations/masterdb.sql` with the same column and table
- Create: `src/lib/academics/dailyRoomClient.ts`
- Create: `src/lib/academics/dailyRoomName.ts`
- Test: `src/__tests__/lib/academics/dailyRoomClient.test.ts`
- Test: `src/__tests__/lib/academics/dailyRoomName.test.ts`
- Test: `src/__tests__/db/sectionDailyRoomsMigration.test.ts`

**Interfaces:**
- Produces:
  - `createDailyRoomName(): string`
  - `type DailyRoomClient = { createPrivateRoom(input: { apiKey: string; roomName: string }): Promise<{ ok: true; url: string } | { ok: false; code: "daily_failed" }>; deleteRoom(input: { apiKey: string; roomName: string }): Promise<{ ok: true } | { ok: false; code: "daily_failed" }>; createMeetingToken(input: { apiKey: string; roomName: string; expUnix: number; isOwner: boolean; userName: string }): Promise<{ ok: true; token: string } | { ok: false; code: "daily_failed" }> }`
  - `createFetchDailyRoomClient(fetchImpl: typeof fetch): DailyRoomClient`

- [ ] **Step 1: Write the failing tests**

`dailyRoomName.test.ts` asserts the name matches `/^s[0-9a-f]{32}$/`.

`dailyRoomClient.test.ts` uses a fake `fetch`:

- `createPrivateRoom` posts to `https://api.daily.co/v1/rooms` with `Authorization: Bearer test-key`, body `{ name, privacy: "private", properties: { enable_knocking: false } }`, and returns `{ ok: true, url }` from `json.url`.
- A non-OK response returns `{ ok: false, code: "daily_failed" }`.
- `deleteRoom` sends `DELETE` to `https://api.daily.co/v1/rooms/${name}`.
- `createMeetingToken` posts to `https://api.daily.co/v1/meeting-tokens` with `properties.room_name`, `properties.exp`, `properties.is_owner`, and `properties.user_name`.

`sectionDailyRoomsMigration.test.ts` reads the SQL file and expects `public.academic_sections`, `delivery_mode`, `public.section_daily_rooms`, `enable row level security`, and no `create policy` for `anon` or `authenticated`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/lib/academics/dailyRoomClient.test.ts src/__tests__/lib/academics/dailyRoomName.test.ts src/__tests__/db/sectionDailyRoomsMigration.test.ts`

Expected: FAIL.

- [ ] **Step 3: Add the migration and the client**

```sql
alter table public.academic_sections
  add column if not exists delivery_mode text not null default 'in_person';

alter table public.academic_sections
  drop constraint if exists academic_sections_delivery_mode_check;

alter table public.academic_sections
  add constraint academic_sections_delivery_mode_check
  check (delivery_mode in ('in_person', 'hybrid', 'remote'));

create table if not exists public.section_daily_rooms (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.academic_sections (id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  daily_room_name text not null,
  daily_room_url text not null,
  created_at timestamptz not null default now(),
  unique (section_id, day_of_week, start_time)
);

alter table public.section_daily_rooms enable row level security;

revoke all on table public.section_daily_rooms from public, anon, authenticated;
```

Mirror that DDL in `masterdb.sql` beside `academic_sections`.

`createDailyRoomName` returns `s` plus `randomBytes(16).toString("hex")`.

`createFetchDailyRoomClient` sends JSON with the bearer header. It logs nothing. It returns `daily_failed` when the response is not OK or the JSON has no `url` or `token`.

Apply with:

```bash
npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/240_section_delivery_mode_and_daily_rooms.sql
```

- [ ] **Step 4: Run the tests and confirm they pass**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 4: Save the mode and sync rooms

**Files:**
- Create: `src/lib/academics/syncSectionDailyRooms.ts`
- Create: `src/app/[locale]/dashboard/admin/academic/sectionDeliveryActions.ts`
- Modify: `src/lib/academics/loadAdminSectionPageData.ts`
- Create: `src/components/organisms/AcademicSectionDeliveryModeForm.tsx`
- Modify: `src/components/organisms/AcademicSectionSettingsSummary.tsx`
- Modify: `src/components/organisms/AcademicSectionConfigurationPanel.tsx`
- Modify: `src/app/[locale]/dashboard/admin/academic/sectionActions.ts`
- Test: `src/__tests__/lib/academics/syncSectionDailyRooms.test.ts`
- Test: `src/__tests__/components/AcademicSectionDeliveryModeForm.test.tsx`

**Interfaces:**
- Consumes: `planDailyRoomSync`, `createDailyRoomName`, `DailyRoomClient`, `parseCommercialPlan`
- Produces: `syncSectionDailyRooms(input: { mode: "in_person" | "hybrid" | "remote"; slots: { dayOfWeek: number; startTime: string; endTime: string }[]; existing: { dayOfWeek: number; startTime: string; dailyRoomName: string }[]; credentials: { apiKey: string; domain: string } | null; client: DailyRoomClient; createName: () => string }): Promise<{ failedSlots: { dayOfWeek: number; startTime: string }[]; rooms: { dayOfWeek: number; startTime: string; dailyRoomName: string; dailyRoomUrl: string }[] }>`
- Produces: `saveAcademicSectionDeliveryModeAction(input: { locale: string; sectionId: string; mode: "in_person" | "hybrid" | "remote" }): Promise<{ ok: true; failedSlots: { dayOfWeek: number; startTime: string }[] } | { ok: false; code: "forbidden" | "invalid" | "not_ecosistema" }>`

- [ ] **Step 1: Write the failing sync test**

Use a fake client. Hybrid with one new slot and credentials calls `createPrivateRoom` once and returns that room. The same call with `credentials: null` creates nothing and lists the slot in `failedSlots`. In person calls `deleteRoom` for each existing row and returns no rooms. A failed delete keeps that room in the returned `rooms` list and in `failedSlots`.

- [ ] **Step 2: Write the failing form test**

Render `AcademicSectionDeliveryModeForm` with `plan="gestion"`. Expect no radio group.

Render it with `plan="ecosistema"` and `mode="in_person"`. Expect three radios named from the dictionary, and no Daily notice.

Render it with `plan="ecosistema"`, `mode="remote"`, and `credentialsReady={false}`. Expect the missing-key text.

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/lib/academics/syncSectionDailyRooms.test.ts src/__tests__/components/AcademicSectionDeliveryModeForm.test.tsx`

Expected: FAIL.

- [ ] **Step 4: Implement the sync and the admin control**

`syncSectionDailyRooms` calls `planDailyRoomSync`. It deletes Daily first. On delete success it omits that row. On delete failure it keeps the row and adds the slot to `failedSlots`. It creates only when credentials exist. Store the `url` string returned by `createPrivateRoom`. If credentials are missing and the plan says create, add those slots to `failedSlots` and do not call the client.

`saveAcademicSectionDeliveryModeAction`:

1. `assertAdmin`. On denial, log `logServerAuthzDenied` with scope `sectionDaily.saveMode` and return `forbidden`.
2. Validate the section id and the mode. Invalid input returns `invalid`.
3. Read the request tenant with `resolveRequestTenant`. If `commercialPlan` is not `ecosistema`, return `not_ecosistema`.
4. Update `academic_sections.delivery_mode`.
5. Load `schedule_slots` and `section_daily_rooms` for that section.
6. Call `syncSectionDailyRooms`. Insert created rows. Delete rows that the sync dropped.
7. `recordSystemAudit` with action `section_delivery_mode_saved`, resource type `academic_section`, resource id the section id, payload `{ deliveryMode }`.
8. `revalidateAcademicSurfaces` and `revalidatePath` for the admin section page and the student and teacher dashboards of that locale.
9. On a Supabase error, `logSupabaseClientError` with scope `sectionDaily.saveMode` and return `{ ok: false, code: "invalid" }`.

`loadAdminSectionPageData` selects `delivery_mode` and returns it on `section`. It also returns `commercialPlan` and `dailyCredentialsReady` from the request tenant. Do not pass the key or the domain to the client component.

`AcademicSectionDeliveryModeForm` is a client form. It renders only when `plan` is `ecosistema`. The three choices use dictionary labels. On success it calls `router.refresh()`. Presencial shows no Daily line. Hybrid and remote show the missing-key sentence when `credentialsReady` is false, and one line per `failedSlot` when the last save returned failures.

Wire the form from `AcademicSectionSettingsSummary` into the configuration panel. Pass only the plan, the mode, the ready flag, and the dictionary.

After `updateAcademicSectionScheduleAction` writes `schedule_slots`, load `delivery_mode`. When it is `hybrid` or `remote`, call the same `syncSectionDailyRooms` path. A removed slot then deletes its room. An added slot creates one. In person skips Daily. Extract that orchestration into `persistSectionDailyRooms` in `src/lib/academics/syncSectionDailyRooms.ts` so the mode action and the schedule action share it.

Copy:

- es: `Cómo se dicta`, `Presencial`, `Híbrida`, `Remota`, `Falta la clave de Daily en la ficha del instituto.`, `No se pudo preparar la sala de {day} {time}.`, `Guardar modalidad`
- en: `How the class meets`, `In person`, `Hybrid`, `Remote`, `The Daily key is missing on the institute record.`, `The room for {day} {time} could not be prepared.`, `Save mode`
- pt: `Como a aula acontece`, `Presencial`, `Híbrida`, `Remota`, `Falta a chave do Daily na ficha do instituto.`, `Não foi possível preparar a sala de {day} {time}.`, `Guardar modalidade`

The save button uses `Button` and a leading `Video` icon from `lucide-react`.

- [ ] **Step 5: Run the tests and confirm they pass**

Same command as Step 3. Expected: PASS.

- [ ] **Step 6: Do not commit**

---

### Task 5: Join token action

**Files:**
- Create: `src/lib/academics/issueSectionDailyToken.ts`
- Create: `src/app/[locale]/dashboard/student/sections/[sectionId]/class/actions.ts`
- Test: `src/__tests__/lib/academics/issueSectionDailyToken.test.ts`

**Interfaces:**
- Consumes: `denyDailyJoin`, `openDailyWindow`, `DailyRoomClient`
- Produces: `issueSectionDailyToken(input: { now: Date; timeZone: string; plan: CommercialPlan; mode: "in_person" | "hybrid" | "remote"; credentials: { apiKey: string; domain: string } | null; slots: { dayOfWeek: number; startTime: string; endTime: string }[]; rooms: { dayOfWeek: number; startTime: string; dailyRoomName: string; dailyRoomUrl: string }[]; role: "teacher" | "student" | "assistant" | "other"; userName: string; requested: { dayOfWeek: number; startTime: string } | null; client: DailyRoomClient }): Promise<{ ok: true; url: string; token: string; dayOfWeek: number; startTime: string } | { ok: false; code: "plan" | "mode" | "credentials" | "room" | "window" | "person" | "daily_failed" }>`

- [ ] **Step 1: Write the failing test**

A teacher inside the Monday 18:00 window receives the stored URL and a token from the fake client, with `isOwner: true`. A student receives `isOwner: false`. An assistant receives `person`. A request for Wednesday while only Monday is open receives `window`. A missing room row receives `room`. A client failure receives `daily_failed`. The test asserts the caller can record `{ sectionId, dayOfWeek, startTime }` and that the token string is not part of that object.

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run src/__tests__/lib/academics/issueSectionDailyToken.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement the issuer and the action**

`issueSectionDailyToken` picks the requested slot when `requested` is set and that slot's window is open. Otherwise it uses `openDailyWindow`. It finds the room row for that slot. It calls `denyDailyJoin` before the client. On allow, it calls `createMeetingToken` with `expUnix` from the window. It does not log the token.

The student route action and a twin teacher action in `src/app/[locale]/dashboard/teacher/sections/[sectionId]/class/actions.ts` share this function. Each action:

1. Requires a session. No session returns `person`.
2. Loads the section `teacher_id`, `delivery_mode`, and `schedule_slots`, plus active enrollment for the user, plus room rows.
3. Role is `teacher` when `user.id === teacher_id`. Role is `student` when an active enrollment exists. Role is `assistant` when `userIsSectionTeacherOrAssistant` is true and the user is not the lead teacher. Otherwise role is `other`.
4. Reads the tenant plan, key, and domain on the server. Reads `analytics.timezone` through the existing effective properties loader. Fallback is `America/Argentina/Cordoba`.
5. On success, `recordUserEventServer` with `eventType: "action"`, `entity: "section:daily_class"`, and metadata `{ sectionId, dayOfWeek, startTime }`.
6. On failure, `logServerWarn` or `logSupabaseClientError` with scope `sectionDaily.join`. Do not log the key or the token.
7. The action return includes `url` and `token` only on success. It never includes `apiKey`.

Add `sectionDailyClass: "section:daily_class"` to `AnalyticsEntity` in `src/lib/analytics/eventConstants.ts` and use that constant as the entity.

- [ ] **Step 4: Run the test and confirm it passes**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 6: Join buttons and the call screen

**Files:**
- Modify: `src/components/student/StudentNextClassCard.tsx`
- Modify: `src/components/student/StudentDashboardEntry.tsx`
- Create: `src/components/teacher/TeacherSectionJoinButton.tsx`
- Modify: `src/app/[locale]/dashboard/teacher/sections/[sectionId]/page.tsx`
- Create: `src/components/daily/DailyCallScreen.tsx`
- Create: `src/components/daily/DailyCallScreenMobile.tsx`
- Create: `src/app/[locale]/dashboard/student/sections/[sectionId]/class/page.tsx`
- Create: `src/app/[locale]/dashboard/teacher/sections/[sectionId]/class/page.tsx`
- Modify: `package.json` and the lockfile with `@daily-co/daily-js`
- Test: `src/__tests__/components/student/StudentNextClassCard.join.test.tsx`
- Test: `src/__tests__/components/daily/DailyCallScreen.test.tsx`

**Interfaces:**
- Consumes: the join actions from Task 5
- The student card receives `joinHref: string | null`. The server page computes it with `openDailyWindow` and the same role and plan checks, without issuing a token.

- [ ] **Step 1: Write the failing UI tests**

`StudentNextClassCard.join.test.tsx`: with `joinHref` null, there is no link named by the join label. With `joinHref` set, the link is present. Render the card inside a 390 px wide container assertion by checking the link class includes `min-h-[44px]` and `w-full`.

`DailyCallScreen.test.tsx`: the leave control has the dictionary name. The component does not render the string `apiKey`. Mock `@daily-co/daily-js` and assert `join` is called with `{ url, token }`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/components/student/StudentNextClassCard.join.test.tsx src/__tests__/components/daily/DailyCallScreen.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Install Daily and build the screens**

Run: `npm install @daily-co/daily-js`

The student home loader computes the open slot. If a window is open for a hybrid or remote Ecosistema section with credentials and a room row, `joinHref` is `/{locale}/dashboard/student/sections/{sectionId}/class?day={day}&start={HH:MM}` and the card title is that class, even when the start is already in the past. If no window is open, keep the current next-class text and pass `joinHref={null}`.

`StudentNextClassCard` renders a `Link` with a leading `Video` icon when `joinHref` is set. The link is `inline-flex min-h-[44px] w-full items-center justify-center gap-2` on every surface. The card already sits in both the desktop and the `PwaPageShell` trees.

`TeacherSectionJoinButton` is the same link, pointed at the teacher class route. On the teacher section page, place it beside the title on wide screens and as a full-width block under the title on narrow screens. Use `w-full lg:w-auto` and `min-h-[44px]`. Do not split the roster.

Both class pages are server components. They read `day` and `start` from the query. `day` is an integer 0 through 6. `start` matches `/^([01]\d|2[0-3]):[0-5]\d$/`. They call the role-specific action with that requested slot. On failure they render the dictionary line for that code and a back link. On success they render `DailyCallScreen` on `web-desktop` and `DailyCallScreenMobile` on `web-mobile` and `pwa-mobile`, through `SurfaceMountGate`.

`DailyCallScreen` dynamically imports `@daily-co/daily-js` and calls `DailyIframe.createFrame` inside a sized container. It joins with `{ url, token }`. The leave button calls `leave()`, destroys the frame, and `router.push` back to the student home or the teacher section. `DailyCallScreenMobile` uses the same join helper and a full-viewport shell with `pt-[env(safe-area-inset-top)]` and a leave button at the bottom with `pb-[env(safe-area-inset-bottom)]` and `min-h-[44px]`.

Copy:

- es: `Entrar a la clase`, `Salir de la clase`, `No puedes entrar a esta clase.`, `Esta clase no tiene videollamada.`, `La videollamada no está lista.`, `La sala todavía no existe.`, `La clase no está abierta ahora.`, `No se pudo abrir la sala.`
- en: `Join the class`, `Leave the class`, `You cannot join this class.`, `This class has no video call.`, `The video call is not ready.`, `The room does not exist yet.`, `The class is not open now.`, `The room could not be opened.`
- pt: `Entrar na aula`, `Sair da aula`, `Você não pode entrar nesta aula.`, `Esta aula não tem videochamada.`, `A videochamada não está pronta.`, `A sala ainda não existe.`, `A aula não está aberta agora.`, `Não foi possível abrir a sala.`

Map codes `person`, `mode`, `credentials`, `room`, `window`, and `daily_failed` to those sentences. `plan` uses the same sentence as `mode`.

Both class pages export `generateMetadata` with `robots: { index: false, follow: false }` and a title from the dictionary. Do not add them to the sitemap or to `llms.txt`.

- [ ] **Step 4: Run the tests and confirm they pass**

Same command as Step 2. Expected: PASS.

- [ ] **Step 5: Do not commit**

---

### Task 7: Changelog and regression sweep

**Files:**
- Modify: `src/lib/product-changelog/catalogEntriesNow.ts`
- Modify: any fixture that builds a full `TenantConfig` and now fails typecheck

**Interfaces:**
- Consumes: the fields from Task 2

- [ ] **Step 1: Prepend the changelog entry**

Add this object at the top of `ENTRIES` in `catalogEntriesNow.ts`:

```ts
{
  id: "section-daily-rooms",
  date: "2026-11-03",
  area: "academic",
  title: t(
    "Una sección de Ecosistema puede tener clase híbrida o remota",
    "An Ecosystem section can meet hybrid or remote",
    "Uma turma do Ecossistema pode ser híbrida ou remota",
  ),
  summary: t(
    "Cada horario tiene una sala privada. El profesor y los alumnos entran desde su panel.",
    "Each weekly slot has a private room. The teacher and students join from their dashboard.",
    "Cada horário tem uma sala privada. O professor e os alunos entram pelo painel.",
  ),
}
```

- [ ] **Step 2: Fix TenantConfig fixtures**

Search tests that construct `TenantConfig` or `PulsarTenantRecord` and add `commercialPlan: "gestion"`, `dailyApiKey: null`, and `dailyDomain: null` where the type requires them.

- [ ] **Step 3: Run the focused suite**

Run:

```bash
npx vitest run src/__tests__/lib/pulsar/commercialPlan.test.ts src/__tests__/lib/pulsar/dailyDomain.test.ts src/__tests__/lib/academics/dailyJoinWindow.test.ts src/__tests__/lib/academics/dailyRoomSyncPlan.test.ts src/__tests__/lib/academics/dailyJoinDenial.test.ts src/__tests__/lib/tenant/tenantPublicEnv.daily.test.ts src/__tests__/lib/academics/dailyRoomClient.test.ts src/__tests__/lib/academics/dailyRoomName.test.ts src/__tests__/db/sectionDailyRoomsMigration.test.ts src/__tests__/lib/academics/syncSectionDailyRooms.test.ts src/__tests__/components/AcademicSectionDeliveryModeForm.test.tsx src/__tests__/lib/academics/issueSectionDailyToken.test.ts src/__tests__/components/student/StudentNextClassCard.join.test.tsx src/__tests__/components/daily/DailyCallScreen.test.tsx src/__tests__/app/savePulsarTenantAction.audit.test.ts
```

Expected: PASS.

- [ ] **Step 4: Do not commit**

---

### Task 8: Commit

**Files:**
- All files from Tasks 1 through 7
- `docs/superpowers/specs/2026-11-03-section-daily-rooms-design.md`
- `docs/adr/2026-11-03-section-daily-rooms.md`
- `docs/superpowers/plans/2026-11-03-section-daily-rooms.md`

- [ ] **Step 1: Review the git status**

If the tree contains files that are not this feature, stop and ask before staging them.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-11-03-section-daily-rooms-design.md docs/adr/2026-11-03-section-daily-rooms.md docs/superpowers/plans/2026-11-03-section-daily-rooms.md supabase/pulsar-migrations/012_tenant_commercial_plan_and_daily.sql supabase/migrations/240_section_delivery_mode_and_daily_rooms.sql supabase/migrations/masterdb.sql src/lib/pulsar/commercialPlan.ts src/lib/pulsar/dailyDomain.ts src/lib/academics/dailyJoinWindow.ts src/lib/academics/dailyRoomSyncPlan.ts src/lib/academics/dailyJoinDenial.ts src/lib/academics/dailyRoomClient.ts src/lib/academics/dailyRoomName.ts src/lib/academics/syncSectionDailyRooms.ts src/lib/academics/issueSectionDailyToken.ts src/lib/tenant/tenantRegistry.ts src/lib/tenant/parseTenantConfigJson.ts src/lib/tenant/tenantPublicEnv.ts src/lib/pulsar/pulsarTenantMapper.ts src/lib/pulsar/pulsarTenantSchema.ts src/components/organisms/pulsar/PulsarAdminTenantFieldGroups.tsx src/components/organisms/pulsar/PulsarAdminTenantLaterFields.tsx src/components/organisms/pulsar/pulsarTenantFormDefaults.ts src/components/organisms/AcademicSectionDeliveryModeForm.tsx src/components/organisms/AcademicSectionSettingsSummary.tsx src/components/organisms/AcademicSectionConfigurationPanel.tsx src/components/student/StudentNextClassCard.tsx src/components/student/StudentDashboardEntry.tsx src/components/teacher/TeacherSectionJoinButton.tsx src/components/daily/DailyCallScreen.tsx src/components/daily/DailyCallScreenMobile.tsx src/app/[locale]/dashboard/admin/academic/sectionDeliveryActions.ts src/app/[locale]/dashboard/admin/academic/sectionActions.ts src/app/[locale]/dashboard/student/sections/[sectionId]/class src/app/[locale]/dashboard/teacher/sections/[sectionId]/class src/app/[locale]/dashboard/teacher/sections/[sectionId]/page.tsx src/lib/academics/loadAdminSectionPageData.ts src/lib/analytics/eventConstants.ts src/lib/product-changelog/catalogEntriesNow.ts src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json .env.example package.json package-lock.json src/__tests__/lib/pulsar/commercialPlan.test.ts src/__tests__/lib/pulsar/dailyDomain.test.ts src/__tests__/lib/academics/dailyJoinWindow.test.ts src/__tests__/lib/academics/dailyRoomSyncPlan.test.ts src/__tests__/lib/academics/dailyJoinDenial.test.ts src/__tests__/lib/tenant/tenantPublicEnv.daily.test.ts src/__tests__/lib/academics/dailyRoomClient.test.ts src/__tests__/lib/academics/dailyRoomName.test.ts src/__tests__/db/sectionDailyRoomsMigration.test.ts src/__tests__/lib/academics/syncSectionDailyRooms.test.ts src/__tests__/components/AcademicSectionDeliveryModeForm.test.tsx src/__tests__/lib/academics/issueSectionDailyToken.test.ts src/__tests__/components/student/StudentNextClassCard.join.test.tsx src/__tests__/components/daily/DailyCallScreen.test.tsx src/__tests__/app/savePulsarTenantAction.audit.test.ts
git commit -m "$(cat <<'EOF'
feat: private Daily room per section slot on the Ecosystem plan

EOF
)"
```

Do not push.

## Manual QA (user)

- Set one institute to Ecosistema and paste a Daily key and domain in Pulsar.
- Mark one section hybrid, with two weekly slots. Confirm two private rooms in the Daily dashboard.
- Join as the teacher and as an enrolled student during the window. Confirm an assistant and a student from another section cannot join.
- Switch the section to in person and confirm the rooms are gone.
- Set the plan back to Gestión and confirm the mode control and the join button disappear.
