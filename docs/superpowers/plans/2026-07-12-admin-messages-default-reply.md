# Admin messages default reply — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Institute-wide editable default reply template for admin Messages; reply-with-default opens compose prefilled with brand placeholders resolved.

**Architecture:** Store plain-text template in `site_settings` (`messaging_default_reply_template`). Pure resolve helper substitutes `{{instituteName}}` / `{{phone}}` from `loadEffectiveProperties`. Admin modal edits template; compose page accepts `useDefault=1` with `replyTo`.

**Tech Stack:** Next.js App Router, Supabase `site_settings`, Zod, Vitest, dictionaries en/es(/pt), Modal + Button DS.

**Spec:** `docs/superpowers/specs/2026-07-12-admin-messages-default-reply-design.md`

## Global Constraints

- Admin-only; no teacher/parent surfaces
- Prefill compose only (no one-click send)
- Plain-text storage + HTML escape on resolve
- i18n chrome in dictionaries; brand values from brand layer
- TDD + self-contained tests; audit on save; revalidate + refresh

## File map

| File | Role |
|------|------|
| `supabase/migrations/169_messaging_default_reply_template.sql` | Seed INSERT ON CONFLICT DO NOTHING |
| `src/lib/messaging/messagingDefaultReplyConstants.ts` | Key, factory default, max length |
| `src/lib/messaging/resolveMessagingDefaultReplyTemplate.ts` | Pure placeholder → escaped HTML |
| `src/lib/messaging/parseMessagingDefaultReplySetting.ts` | Parse JSONB value |
| `src/lib/messaging/loadMessagingDefaultReplyTemplate.ts` | Load or fallback |
| `src/lib/messaging/updateMessagingDefaultReplyTemplate.ts` | Upsert |
| `src/app/.../admin/messages/defaultReplyActions.ts` | Admin save action + audit |
| `src/components/dashboard/AdminEditDefaultReplyModal.tsx` | Edit UI |
| `src/components/dashboard/AdminMessagesDefaultReplyHeaderActions.tsx` | Write + Edit CTAs |
| `AdminMessageCard.tsx`, detail page, compose page, `AdminPortalCompose.tsx` | CTAs + initialBody |
| Dictionaries en/es (+ pt if messages keys exist) | Copy |
| Tests under `src/__tests__/lib/messaging/` + components | Coverage |

## Tasks

### Task 1: Pure resolve + constants

- [x] RED: `resolveMessagingDefaultReplyTemplate.test.ts` — substitutes placeholders; escapes HTML; unknown tokens unchanged
- [x] GREEN: implement constants + resolve + parse helpers
- [x] RED/GREEN: parse setting value shapes

### Task 2: Load + update + migration

- [x] Migration seed `169_…`
- [x] RED/GREEN: load missing → factory; update upsert path (mocked supabase)
- [x] Action with assertAdmin, Zod, audit, revalidate

### Task 3: UI edit + reply CTAs + compose prefill

- [x] Header actions + modal
- [x] Card + detail `useDefault=1` links
- [x] Compose page + `initialBody` prop
- [x] Dict keys en/es/(pt)
- [x] RTL smokes
- [x] Short ADR if needed

### Task 4: Verify

- [x] Targeted vitest pass
- [ ] Spec DoD checklist
- [ ] Manual QA list for user
