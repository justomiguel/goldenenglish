# Directory cuota, matrícula, and last enrollment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show monthly-current and enrollment-fee marks plus a sortable last-enrollment date on admin Alumnos and Padres lists.

**Architecture:** Pure helpers compute tri-state marks and parent rollups. A batch loader builds the same monthly year-summary rule as the portal (`studentMonthlyPaymentsViewHasOverdueBalance`) and the same matrícula paid/charged predicates as Finanzas. Directory extras attach the three fields before `sortAdminUsers` paginates. UI reuses the existing cuota cell on Alumnos and adds Matrícula + Última inscripción (Padres also get a mark-only Cuota column).

**Tech Stack:** Next.js App Router, TypeScript, Vitest, Testing Library, existing billing helpers, es/en/pt dictionaries.

## Global Constraints

- Files stay under the 250-line ceiling; new billing logic lives in new files, not stuffed into extras.
- UI copy in es / en / pt only; no hardcoded staff strings.
- No migrations or denormalized flags.
- Tests isolated (no live Supabase).
- Reuse `studentMonthlyPaymentsViewHasOverdueBalance` and charged/paid matrícula predicates; do not invent a second billing rule.

**Spec:** `docs/superpowers/specs/2026-08-29-directory-quota-enrollment-status-design.md`

---

### File map

| File | Role |
|------|------|
| `src/lib/dashboard/directoryBillingStatus.ts` | Pure marks, rollup, date max, sort rank |
| `src/lib/dashboard/loadDirectoryStudentBillingFlags.ts` | Batch I/O for student flags |
| `src/lib/dashboard/adminUsersTableHelpers.ts` | Row fields + sort keys |
| `src/lib/dashboard/loadAdminStudentDirectoryExtras.ts` | Attach student flags |
| `src/lib/dashboard/loadAdminParentDirectoryExtras.ts` | Attach parent rollups |
| `src/lib/dashboard/loadAdminLockedRoleDirectory.ts` | Pass flags through sort + page rows |
| `src/lib/dashboard/lockedRoleUsersParams.ts` | Accept new sort keys |
| `src/lib/dashboard/loadPaginatedAdminUsers.ts` | `SORT_COLUMN_MAP` + default row fields |
| `src/components/molecules/DirectoryBillingMark.tsx` | Sí / No / — pill |
| `src/components/molecules/AdminStudentDirectoryCells.tsx` | Cuota cell + new cells |
| `src/components/dashboard/AdminUsersDataTable.tsx` | Columns |
| `src/components/dashboard/AdminUsersDataTableRow.tsx` | Cells |
| `src/components/pwa/molecules/AdminUsersPwaList.tsx` | Sort keys |
| `src/components/pwa/molecules/AdminUsersPwaListItem.tsx` | Card facts |
| `src/dictionaries/{es,en,pt}.json` | Labels + tooltips |
| `src/lib/product-changelog/catalog.ts` | Staff-facing What's-new |

---

### Task 1: Pure billing marks

**Files:**
- Create: `src/lib/dashboard/directoryBillingStatus.ts`
- Test: `src/__tests__/lib/dashboard/directoryBillingStatus.test.ts`

**Produces:**
- `DirectoryBillingMark = "yes" | "no" | "na"`
- `directoryMonthlyStatus({ monthlyApplies, overdue })`
- `enrollmentFeeChargeState({ amount, exempt, lastEnrollmentPaidAt, receiptStatus })`
- `directoryEnrollmentFeeStatus(charges: { charged: boolean; paid: boolean }[])`
- `rollupDirectoryBillingMarks(marks: DirectoryBillingMark[])`
- `latestEnrollmentAt(timestamps: Array<string | null | undefined>)`
- `directoryBillingMarkSortRank(mark)` → `no=0`, `na=1`, `yes=2`
- `formatDirectoryLastEnrollment(iso, locale, emptyValue)`

- [x] Write failing tests, then implement helpers (TDD)

---

### Task 2: Sort keys and params

**Files:**
- Modify: `src/lib/dashboard/adminUsersTableHelpers.ts`
- Modify: `src/lib/dashboard/lockedRoleUsersParams.ts`
- Modify: `src/lib/dashboard/loadPaginatedAdminUsers.ts` (`SORT_COLUMN_MAP`)
- Test: `src/__tests__/lib/adminUsersTableHelpers.test.ts`
- Test: `src/__tests__/lib/dashboard/lockedRoleUsersParams.test.ts`

**Produces:** `AdminUserRow.monthlyStatus`, `.enrollmentFeeStatus`, `.lastEnrollmentAt`; `SortKey` adds `lastEnrollment` and `enrollmentFee`. Empty last-enrollment dates sort last via `compareSortValues`. Matrícula sorts by rank.

- [x] Failing sort/param tests, then wire fields and sort

---

### Task 3: Batch loader + extras

**Files:**
- Create: `src/lib/dashboard/loadDirectoryStudentBillingFlags.ts`
- Modify: student/parent extras + locked directory row mapping
- Test: extras tests (empty maps + new fields)

**Produces:** `Map<studentId, { monthlyStatus, enrollmentFeeStatus, lastEnrollmentAt }>`. Monthly `na` when no applicable monthly cells; else portal overdue helper. Matrícula from charge state. Parent rollup via `rollupDirectoryBillingMarks` / `latestEnrollmentAt`. Loader failure for one student → that student `na`.

- [x] Failing extras expectations, then load and attach flags

---

### Task 4: UI + i18n + PWA

**Files:** mark component, directory cells, table, table row, PWA list/item, dictionaries, changelog, table/PWA tests

**Produces:** Column order from the spec. Pills + tooltips. PWA sort includes the two new keys.

- [x] Failing table/PWA tests, then UI

---

### Task 5: Verify

Run isolated tests for the touched files. Confirm Alumnos/Padres columns if the local app is up.

- [x] Verification before claiming done
