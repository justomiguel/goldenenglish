export const PROGRESS_SEEN_STORAGE_PREFIX = "ge:progress-seen:v1";

/** Upper bound per section so a long-lived device never grows an unbounded entry. */
export const PROGRESS_SEEN_MAX_KEYS_PER_SECTION = 200;

export type ProgressSeenMap = Record<string, string[]>;

export function progressSeenStorageKey(studentId: string | null | undefined): string {
  return `${PROGRESS_SEEN_STORAGE_PREFIX}:${studentId || "none"}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

/**
 * Tolerant reader for whatever sits under the storage key: anything unexpected degrades to "nothing
 * seen yet" rather than throwing, because this runs during the render of the whole Progress screen.
 */
export function parseSeenMap(raw: string | null | undefined): ProgressSeenMap {
  if (!raw) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};

  const map: ProgressSeenMap = {};
  for (const [sectionId, keys] of Object.entries(parsed as Record<string, unknown>)) {
    if (isStringArray(keys)) map[sectionId] = keys;
  }
  return map;
}

export function serializeSeenMap(map: ProgressSeenMap): string {
  return JSON.stringify(map);
}

/** Items present now that this device has not seen yet. An unopened section counts in full. */
export function countUnreadKeys(itemKeys: string[], seenKeys: string[] | undefined): number {
  if (itemKeys.length === 0) return 0;
  if (!seenKeys || seenKeys.length === 0) return itemKeys.length;

  const seen = new Set(seenKeys);
  return itemKeys.reduce((count, key) => (seen.has(key) ? count : count + 1), 0);
}

export function mergeSeenKeys(itemKeys: string[], seenKeys: string[] | undefined): string[] {
  const merged = [...(seenKeys ?? [])];
  const seen = new Set(merged);

  for (const key of itemKeys) {
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }

  return merged.length > PROGRESS_SEEN_MAX_KEYS_PER_SECTION
    ? merged.slice(merged.length - PROGRESS_SEEN_MAX_KEYS_PER_SECTION)
    : merged;
}
