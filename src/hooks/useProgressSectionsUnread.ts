"use client";

import { useEffect, useState } from "react";
import type { ProgressSection } from "@/lib/parent/buildProgressSections";
import {
  countUnreadKeys,
  mergeSeenKeys,
  parseSeenMap,
  progressSeenStorageKey,
  serializeSeenMap,
  type ProgressSeenMap,
} from "@/lib/parent/progressSeenStorage";

export type UseProgressSectionsUnreadOptions = {
  studentId: string | null;
  sections: ProgressSection[];
  activeSectionId: string;
};

export type UseProgressSectionsUnreadResult = {
  /** Unseen item count per section id. Empty until the effect has read storage. */
  unreadBySection: Record<string, number>;
};

function readSeenMap(storageKey: string): ProgressSeenMap | null {
  try {
    return parseSeenMap(window.localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

function writeSeenMap(storageKey: string, map: ProgressSeenMap): void {
  try {
    window.localStorage.setItem(storageKey, serializeSeenMap(map));
  } catch {
    // Private mode or quota: the pills stay accurate for this session and that is enough.
  }
}

/**
 * Per-device "you have not looked at this yet" counters for the Progress sections.
 *
 * Storage is only touched in an effect, so the server render and the first client render agree that
 * nothing is unread; the pills appear right after hydration.
 */
export function useProgressSectionsUnread({
  studentId,
  sections,
  activeSectionId,
}: UseProgressSectionsUnreadOptions): UseProgressSectionsUnreadResult {
  const [unreadBySection, setUnreadBySection] = useState<Record<string, number>>({});
  const sectionsSignature = sections.map((s) => `${s.id}:${s.itemKeys.join(",")}`).join("|");

  useEffect(() => {
    const storageKey = progressSeenStorageKey(studentId);
    const seenMap = readSeenMap(storageKey);
    if (!seenMap) {
      setUnreadBySection({});
      return;
    }

    const activeSection = sections.find((section) => section.id === activeSectionId);
    if (activeSection) {
      seenMap[activeSection.id] = mergeSeenKeys(activeSection.itemKeys, seenMap[activeSection.id]);
      writeSeenMap(storageKey, seenMap);
    }

    const next: Record<string, number> = {};
    for (const section of sections) {
      next[section.id] = countUnreadKeys(section.itemKeys, seenMap[section.id]);
    }
    setUnreadBySection(next);
    // `sectionsSignature` stands in for `sections`: it changes exactly when the item keys do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activeSectionId, sectionsSignature]);

  return { unreadBySection };
}
