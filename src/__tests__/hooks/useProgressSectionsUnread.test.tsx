// REGRESSION CHECK: the unread pills on Progress come from here. Invariants: nothing is reported as
// unread on the first (server-matching) render, the section the user is looking at is marked read,
// and a hostile localStorage never breaks the screen.

import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProgressSectionsUnread } from "@/hooks/useProgressSectionsUnread";
import {
  parseSeenMap,
  progressSeenStorageKey,
} from "@/lib/parent/progressSeenStorage";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";
import type { ProgressSection } from "@/lib/parent/buildProgressSections";

const SECTIONS: ProgressSection[] = [
  { id: "tasks", count: 2, itemKeys: ["t1", "t2"] },
  { id: "feedback", count: 3, itemKeys: ["f1", "f2", "f3"] },
];

let storage: Storage;

beforeEach(() => {
  storage = installMemoryLocalStorage();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useProgressSectionsUnread", () => {
  it("marks the active section as read and reports the rest as unread on a first visit", () => {
    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    expect(result.current.unreadBySection.tasks).toBe(0);
    expect(result.current.unreadBySection.feedback).toBe(3);
  });

  it("persists the active section keys so a later visit is clean", () => {
    renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    const stored = parseSeenMap(window.localStorage.getItem(progressSeenStorageKey("stu-1")));
    expect(stored.tasks).toEqual(["t1", "t2"]);
  });

  it("clears the pill when the user switches to that section", () => {
    const { result, rerender } = renderHook(
      ({ activeSectionId }: { activeSectionId: string }) =>
        useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId }),
      { initialProps: { activeSectionId: "tasks" } },
    );

    expect(result.current.unreadBySection.feedback).toBe(3);

    act(() => {
      rerender({ activeSectionId: "feedback" });
    });

    expect(result.current.unreadBySection.feedback).toBe(0);
  });

  it("only flags the items that appeared since the last visit", () => {
    window.localStorage.setItem(
      progressSeenStorageKey("stu-1"),
      JSON.stringify({ feedback: ["f1", "f2"] }),
    );

    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    expect(result.current.unreadBySection.feedback).toBe(1);
  });

  it("keeps students apart", () => {
    window.localStorage.setItem(
      progressSeenStorageKey("stu-2"),
      JSON.stringify({ feedback: ["f1", "f2", "f3"] }),
    );

    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    expect(result.current.unreadBySection.feedback).toBe(3);
  });

  it("reports nothing unread when reading storage throws", () => {
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });

    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    expect(result.current.unreadBySection).toEqual({});
  });

  it("survives a storage write failure", () => {
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "tasks" }),
    );

    expect(result.current.unreadBySection.feedback).toBe(3);
  });

  it("ignores an active section that is not on offer", () => {
    const { result } = renderHook(() =>
      useProgressSectionsUnread({ studentId: "stu-1", sections: SECTIONS, activeSectionId: "badges" }),
    );

    expect(result.current.unreadBySection.tasks).toBe(2);
    expect(result.current.unreadBySection.feedback).toBe(3);
  });
});
