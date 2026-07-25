# Section Fees layout — Implementation Plan

**Goal:** Fees area = read-only summary + Amounts block + Charge rules block; keep four independent saves.

**Status:** Implemented (Manual QA user-owned).

## Done

1. Pure helper `resolveSectionFeesSummaryPlan` + Vitest.
2. `embedded` on four fee editors (lighter chrome / h3).
3. `AcademicSectionFeesSummary` + `AcademicSectionFeesPanel`.
4. Wire via `AcademicSectionPageShellBody` + institute calendar `feesAsOfYear` / `feesAsOfMonth`.
5. Dictionaries `feesPanel` in en/es/pt; `resolveAcademicSectionPageSubdicts`.
6. Vitest: `AcademicSectionFeesPanel.test.tsx` (order + summary smoke).

## Manual QA (user)

- Open section → Fees: confirm summary → Amounts → Charge rules.
- Edit each of the four controls; after save, summary chips match.
