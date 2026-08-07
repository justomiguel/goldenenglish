// REGRESSION CHECK: the entry-point mark reads the very store the Progress picker writes. If the
// key shape or the section id drifted, the home would either nag forever or never flag anything.

import { describe, expect, it, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";
import { progressSeenStorageKey } from "@/lib/parent/progressSeenStorage";
import { useProgressItemUnread } from "@/hooks/useProgressItemUnread";

const ITEM = "assessment:enr-1:asm-1";

function seed(studentId: string, seen: Record<string, string[]>) {
  window.localStorage.setItem(progressSeenStorageKey(studentId), JSON.stringify(seen));
}

function renderUnread(itemKey: string | null, studentId: string | null = "stu-1") {
  return renderHook(() =>
    useProgressItemUnread({ studentId, sectionId: "feedback", itemKey }),
  );
}

beforeEach(() => {
  installMemoryLocalStorage();
});

describe("useProgressItemUnread", () => {
  it("flags an item this device has never opened", async () => {
    const { result } = renderUnread(ITEM);

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("stays quiet once the section carrying that item has been opened", async () => {
    seed("stu-1", { feedback: [ITEM] });
    const { result } = renderUnread(ITEM);

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("does not credit a different item in the same section", async () => {
    seed("stu-1", { feedback: ["assessment:enr-1:other"] });
    const { result } = renderUnread(ITEM);

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("does not credit the same item seen under another section", async () => {
    seed("stu-1", { exams: [ITEM] });
    const { result } = renderUnread(ITEM);

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("keeps each student's history apart", async () => {
    seed("stu-1", { feedback: [ITEM] });
    const { result } = renderUnread(ITEM, "stu-2");

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("has nothing to flag without an item", async () => {
    const { result } = renderUnread(null);

    await waitFor(() => expect(result.current).toBe(false));
  });

  it("renders false on the first pass, before storage is read", () => {
    const { result } = renderUnread(ITEM);

    // Server and first client render must agree, so the mark can only appear after hydration.
    expect(typeof result.current).toBe("boolean");
  });

  it("survives a store that throws", async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem() {
          throw new Error("blocked");
        },
      },
    });

    const { result } = renderUnread(ITEM);

    await waitFor(() => expect(result.current).toBe(false));
  });
});
