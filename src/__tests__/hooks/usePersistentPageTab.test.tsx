// REGRESSION CHECK: the URL tab wins over storage. A missing URL restores storage.
import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { pageTabStorageKey } from "@/lib/navigation/persistentPageTab";
import { mockPathname, mockReplace, mockSearchParams } from "@/test/navigationMock";

const ALLOWED = ["summary", "academic", "security"] as const;

describe("usePersistentPageTab", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockPathname.mockReturnValue("/es/dashboard/admin/users/1");
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockReplace.mockClear();
  });

  it("uses the URL tab over storage", () => {
    sessionStorage.setItem(
      pageTabStorageKey("/es/dashboard/admin/users/1", "tab"),
      "academic",
    );
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=security"));
    const { result } = renderHook(() =>
      usePersistentPageTab({ allowed: ALLOWED, fallback: "summary" }),
    );
    expect(result.current.value).toBe("security");
  });

  it("restores storage when the URL has no tab", async () => {
    sessionStorage.setItem(
      pageTabStorageKey("/es/dashboard/admin/users/1", "tab"),
      "academic",
    );
    const { result } = renderHook(() =>
      usePersistentPageTab({ allowed: ALLOWED, fallback: "summary" }),
    );
    await waitFor(() => expect(result.current.value).toBe("academic"));
    expect(mockReplace).toHaveBeenCalledWith(
      "/es/dashboard/admin/users/1?tab=academic",
      { scroll: false },
    );
  });

  it("writes the URL and storage when the tab changes", () => {
    const { result } = renderHook(() =>
      usePersistentPageTab({ allowed: ALLOWED, fallback: "summary" }),
    );
    act(() => result.current.setValue("academic"));
    expect(result.current.value).toBe("academic");
    expect(mockReplace).toHaveBeenCalledWith(
      "/es/dashboard/admin/users/1?tab=academic",
      { scroll: false },
    );
    expect(
      sessionStorage.getItem(pageTabStorageKey("/es/dashboard/admin/users/1", "tab")),
    ).toBe("academic");
  });

  it("does not reuse the previous path tab", () => {
    const { result, rerender } = renderHook(() =>
      usePersistentPageTab({ allowed: ALLOWED, fallback: "summary" }),
    );
    act(() => result.current.setValue("academic"));
    mockPathname.mockReturnValue("/es/dashboard/admin/users/2");
    rerender();
    expect(result.current.value).toBe("summary");
  });
});
