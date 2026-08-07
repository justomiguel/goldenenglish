# Create minor guardian search — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or TDD vertical slices) to implement this plan task-by-task.

**Goal:** Fix admin “link existing guardian” search when creating a minor student (shared parent prefix search + create UX/copy).

**Architecture:** Keep `searchAdminParentsByPrefix` as the pure adapter; enrich PostgREST `.or()` with per-token prefixes + in-memory `personProfileMatchPrefix` filter; optional full-email → `findAuthUserIdByNormalizedEmail`. Create panel enables `prefetchWhenEmptyOnFocus` and honest dictionary copy.

**Tech stack:** Vitest, Supabase admin client, `AdminStudentSearchCombobox`, dictionaries en/es/pt.

## File map

| File | Role |
|---|---|
| `src/lib/users/searchAdminParentsByPrefix.ts` | Search semantics |
| `src/__tests__/lib/users/searchAdminParentsByPrefix.test.ts` | Behavior tests |
| `src/components/dashboard/AdminCreateUserMinorGuardianPanel.tsx` | Prefetch + tooltip |
| `src/dictionaries/en.json` / `es.json` / `pt.json` | Copy alignment |
| Spec | Mark Approved |

## Tasks

1. TDD: multi-token parent prefix search  
2. TDD: full-email → parent hit  
3. Create panel prefetch + i18n  
4. Verify targeted Vitest  
