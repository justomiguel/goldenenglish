import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useComboboxDropdownPosition } from "@/hooks/useComboboxDropdownPosition";

describe("useComboboxDropdownPosition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when closed", () => {
    const inputRef = { current: document.createElement("input") };
    const { result } = renderHook(() => useComboboxDropdownPosition(false, inputRef));
    expect(result.current).toBeNull();
  });

  it("returns viewport rect below the input when open", async () => {
    const el = document.createElement("input");
    document.body.append(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      top: 10,
      bottom: 40,
      left: 8,
      right: 208,
      width: 200,
      height: 30,
      x: 8,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);
    const inputRef = { current: el };
    const { result } = renderHook(() => useComboboxDropdownPosition(true, inputRef));
    await waitFor(() => {
      expect(result.current).toEqual({ top: 40, left: 8, width: 200 });
    });
    el.remove();
  });
});
