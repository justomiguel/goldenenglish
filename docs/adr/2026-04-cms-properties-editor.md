# Raw properties editor for CMS templates (PR 5)

- **Status:** Accepted — 2026-04
- **Context:** Runtime theming ADR (`docs/adr/2026-04-runtime-theming-overrides.md`) and the grouped tokens editor (PR 3).

## Context

PR 3 shipped a grouped token editor at `/dashboard/admin/cms/templates/[id]`
that renders one field per key **already declared in `system.properties`** and
grouped by prefix (`color.*`, `layout.*`, `shadow.*`, `app.*`, `contact.*`,
`social.*`). That UI covers 99% of day-to-day theming, but has two blind spots:

1. **Keys not yet in `system.properties`** — the editor can only render fields
   for keys already listed as defaults. If the admin wants to add a brand-new
   allow-listed key that is supported by the runtime (e.g. `social.tiktok`,
   `color.seasonal-accent`), there is no UI today to do it without shipping a
   code change.
2. **Discovery of the merged view** — the grouped editor hides keys whose
   override equals the default to keep the UI minimal, but this makes it hard
   to see the full effective map of defaults + overrides on a single screen
   when auditing a template.

We still want the grouped editor to remain the friendly, default path. The raw
editor exists to unblock the long-tail cases above without loosening the
allow-list enforced everywhere else (`THEME_OVERRIDE_KEY_PREFIXES` in
`src/types/theming.ts`, sanitizer in `cleanThemeOverridesForPersistence`,
Zod schema in `siteThemeInputSchemas.ts`).

## Decision

Ship a second editor at `/dashboard/admin/cms/templates/[id]/properties` that:

1. **Renders a flat table** with columns `Key | Default | Override | Actions`
   built from a pure helper (`buildRawPropertyRows`) that merges defaults with
   persisted overrides, restricted to the allow-list.
2. **Supports three draft operations** in the client shell:
   - Inline edit of any cell’s override value (string input).
   - Reset (clears the draft entry, which results in the row falling back to
     its default after save).
   - Remove (same as reset, shown only for keys that have **no** declared
     default so the admin can undo their custom additions).
3. **Adds a "new override" form** above the table that validates the key
   client-side against the allow-list pattern and the Zod token key regex used
   by the server (`/^[a-z][a-z0-9.]*[a-z0-9]$/u`).
4. **Reuses the existing server actions** `updateSiteThemePropertiesAction`
   and `resetSiteThemePropertiesAction` — no new action, no new endpoint. The
   shell submits the full overrides draft; the server-side sanitizer drops
   empty values and values matching the default, so omitting a key from the
   draft effectively "removes" the override without a bespoke contract.
5. **Reuses the audit trail** (`site_theme_properties_updated` /
   `site_theme_properties_reset`) and the cache invalidation
   (`revalidateSiteThemeSurfaces`).

### Discarded options

- **A dedicated `removeSiteThemeOverrideAction`.** Would duplicate the
  contract of `update` without adding safety (the client can already omit a
  key from the payload). More actions = more surfaces to keep consistent with
  RLS, auditing, and tests. Rejected.
- **A JSON textarea editor.** Would let admins paste any JSON, bypassing
  per-key UX and making client-side validation messy. Also makes mistakes
  (wrong prefix, wrong value type) harder to explain. Rejected — the raw
  editor still respects the allow-list and shows defaults side by side.
- **Merging this UI into the grouped editor.** Tempting, but the grouped
  editor is already near the 250-line ceiling per file and serves a different
  audience (designers fine-tuning a palette vs. admins adding a late-bound
  key). Splitting keeps both UIs focused.

## Consequences

### Positive

- Admins can now manage the **full allow-listed surface** (add, edit, remove
  any key) without code changes.
- The persisted shape stays minimal because the server-side sanitizer still
  strips keys whose override matches the default, keeping
  `site_themes.properties` diff-friendly.
- No new server action, no new Zod schema, no new migration — purely a UI +
  pure helpers addition layered on top of PR 3.

### Risks

- An admin can introduce a key the runtime doesn’t actually read (e.g. a typo
  like `color.primaryy`). The allow-list prefix check prevents unrelated
  namespaces from leaking in, but doesn’t know which keys the CSS layer
  actually consumes. Accepted risk: the grouped editor stays the primary path,
  and these stray keys are visible on the raw view for easy cleanup.
- Raw editing makes it easier to accidentally paste unexpected characters
  into brand strings (`app.name`). Mitigated by the Zod `tokenValueSchema`
  (200-char cap) and the shared sanitizer; a future enhancement could bring
  value-level validators per key kind.

### Follow-ups

- Unit tests for pure helpers (`buildRawPropertyRows`,
  `buildInitialRawEditorDraft`, `isRawEditorDraftDirty`,
  `computeVisibleRawRows`, `computeMergedRawKeys`).
- Precommit and `npm run check:supabase-boundaries` must stay green (the
  route loads via `assertAdmin().supabase`, per
  `12-supabase-app-boundaries.mdc`).
- If a future need arises for value-type awareness (color picker for new
  color keys, URL validator for `social.*`), extend the row component behind
  the existing `tokenFieldKindFromKey` helper and keep the allow-list single
  source of truth.
