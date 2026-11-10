# Exclusive client themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An exclusive landing belongs to its owner tenant, and a written intake process exists for the next special-landing request.

**Architecture:** A pure map in `src/lib/theme/exclusiveThemeKinds.ts` names the owner slug of each bespoke `SiteThemeKind`. The CMS picker and `setSiteThemeKindAction` both call `canTenantUseThemeKind`. Catalog kinds and `classic` / `editorial` / `minimal` stay open. A null tenant (no registry) stays open.

**Tech Stack:** Next.js App Router, Vitest, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Owner rows: `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora` (slugs from `scripts/vercel-targets.json`).
- Rejected switch returns `kind_not_available` and logs `[ge:server]` scope `cms.setSiteThemeKind`.
- A generic institute still sees only `GENERIC_INSTITUTE_KINDS`.
- Exclusive kinds never enter `GENERIC_INSTITUTE_KINDS`.
- Tier B CMS screen. No public landing or `/register` change.
- The new academy theme is out of scope.

## File map

- Create `src/lib/theme/exclusiveThemeKinds.ts` — owners, allow check, picker list.
- Create `src/__tests__/lib/theme/exclusiveThemeKinds.test.ts`.
- Edit `setSiteThemeKindAction.ts`, `siteThemeActionShared.ts` (error code), both landing overview pages, `LandingEditorOverview.tsx`.
- Edit `en.json`, `es.json`, `pt.json` kind-picker errors.
- Edit picker test, action test, `PulsarTemplateCatalog` test.
- Create runbook, rule `51`, ADR. Link `add-new-tenant.md` and `AGENTS.md`.
- Prepend a cms changelog row.

## Tasks

- [x] Red: exclusive-kind unit tests. Green: the pure module.
- [x] Red: action rejects a foreign kind and allows the owner. Green: guard + `kind_not_available`.
- [x] Dictionary sentences. Picker tests for that code and an unknown code.
- [x] Pass `tenantSlug` from the institute page (`resolveRequestTenant`) and from the CentroListo tenant route. Overview filters the list.
- [x] Catalog test: no exclusive kind in the cards.
- [x] Runbook, rule, ADR, links, changelog.
- [x] `vitest` on touched files, eslint, and `tsc --noEmit`.
