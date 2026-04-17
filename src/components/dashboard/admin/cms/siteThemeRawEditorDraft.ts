import type { RawPropertyRow } from "@/lib/cms/buildRawPropertyRows";

/**
 * Pure helpers for the raw properties editor (PR 5).
 *
 * The editor keeps the working overrides map in memory as `Record<string,string>`.
 * An entry is present only when the admin has an explicit override; deleting a
 * key = "remove the override" (fall back to default). This module contains the
 * diffing/normalization pieces both the shell and its tests share.
 */

export type RawEditorDraft = Record<string, string>;

/** Initial draft built from server-provided rows: we mirror only the keys with
 *  an active override so submitting without changes is idempotent. */
export function buildInitialRawEditorDraft(
  rows: ReadonlyArray<RawPropertyRow>,
): RawEditorDraft {
  const draft: RawEditorDraft = {};
  for (const row of rows) {
    if (row.overrideValue !== null) draft[row.key] = row.overrideValue;
  }
  return draft;
}

/** Returns true when the draft differs from the committed state represented by
 *  `rows` (order-independent, handles additions and removals). */
export function isRawEditorDraftDirty(
  rows: ReadonlyArray<RawPropertyRow>,
  draft: RawEditorDraft,
): boolean {
  const initial = buildInitialRawEditorDraft(rows);
  const initialKeys = Object.keys(initial);
  const draftKeys = Object.keys(draft);
  if (initialKeys.length !== draftKeys.length) return true;
  for (const key of draftKeys) {
    if (initial[key] !== draft[key]) return true;
  }
  return false;
}

/** Merges committed rows with any pending-draft-only keys (newly added ones),
 *  producing a stable, alphabetically sorted visible list. */
export function computeVisibleRawRows(
  rows: ReadonlyArray<RawPropertyRow>,
  draft: RawEditorDraft,
): ReadonlyArray<RawPropertyRow> {
  const byKey = new Map<string, RawPropertyRow>();
  for (const row of rows) byKey.set(row.key, row);
  for (const key of Object.keys(draft)) {
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        defaultValue: null,
        overrideValue: draft[key],
        isOverridden: true,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

/** Union of committed + draft keys, for duplicate detection in the add form. */
export function computeMergedRawKeys(
  rows: ReadonlyArray<RawPropertyRow>,
  draft: RawEditorDraft,
): ReadonlyArray<string> {
  const set = new Set<string>();
  for (const row of rows) set.add(row.key);
  for (const key of Object.keys(draft)) set.add(key);
  return Array.from(set);
}
