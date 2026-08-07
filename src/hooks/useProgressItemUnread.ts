"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parseSeenMap, progressSeenStorageKey } from "@/lib/parent/progressSeenStorage";

function readIsUnread(
  studentId: string | null,
  sectionId: string,
  itemKey: string | null,
): boolean {
  if (!itemKey) return false;
  try {
    const seenMap = parseSeenMap(
      window.localStorage.getItem(progressSeenStorageKey(studentId)),
    );
    return !(seenMap[sectionId] ?? []).includes(itemKey);
  } catch {
    // Private mode or a blocked store: stay quiet rather than nagging on every visit.
    return false;
  }
}

/**
 * Whether one Progress item is still unopened on this device.
 *
 * Read-only on purpose: the entry point may flag a comment, but only opening the Progress section
 * clears it. `useSyncExternalStore` keeps the server snapshot at `false` so hydration matches, then
 * reads localStorage on the client.
 */
export function useProgressItemUnread({
  studentId,
  sectionId,
  itemKey,
}: {
  studentId: string | null;
  /** Progress section the item belongs to, e.g. `feedback`. */
  sectionId: string;
  /** Item identity as the Progress screen records it. Null means "nothing to mark". */
  itemKey: string | null;
}): boolean {
  const storageKey = progressSeenStorageKey(studentId);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === storageKey) onStoreChange();
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    },
    [storageKey],
  );

  return useSyncExternalStore(
    subscribe,
    () => readIsUnread(studentId, sectionId, itemKey),
    () => false,
  );
}
