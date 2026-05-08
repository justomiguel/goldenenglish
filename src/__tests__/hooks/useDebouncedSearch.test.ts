import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDebouncedSearch,
  SEARCH_DEBOUNCE_MS,
} from "@/hooks/useDebouncedSearch";

describe("useDebouncedSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns initial value as localValue", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "initial", onDebouncedChange }),
    );

    expect(result.current.localValue).toBe("initial");
  });

  it("updates localValue immediately on setLocalValue", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "", onDebouncedChange }),
    );

    act(() => {
      result.current.setLocalValue("test");
    });

    expect(result.current.localValue).toBe("test");
    expect(onDebouncedChange).not.toHaveBeenCalled();
  });

  it("calls onDebouncedChange after debounce delay", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "", onDebouncedChange }),
    );

    act(() => {
      result.current.setLocalValue("search term");
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    expect(onDebouncedChange).toHaveBeenCalledWith("search term");
  });

  it("resets debounce timer on subsequent changes", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "", onDebouncedChange }),
    );

    act(() => {
      result.current.setLocalValue("a");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.setLocalValue("ab");
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    expect(onDebouncedChange).toHaveBeenCalledWith("ab");
  });

  it("flushNow calls onDebouncedChange immediately", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "", onDebouncedChange }),
    );

    act(() => {
      result.current.setLocalValue("flush me");
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();

    act(() => {
      result.current.flushNow();
    });

    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    expect(onDebouncedChange).toHaveBeenCalledWith("flush me");
  });

  it("flushNow does not call onDebouncedChange if value unchanged", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "same", onDebouncedChange }),
    );

    act(() => {
      result.current.flushNow();
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();
  });

  it("syncs localValue when server value changes", () => {
    const onDebouncedChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedSearch({ value, onDebouncedChange }),
      { initialProps: { value: "initial" } },
    );

    expect(result.current.localValue).toBe("initial");

    rerender({ value: "from server" });

    expect(result.current.localValue).toBe("from server");
  });

  it("does not trigger callback when localValue equals server value", () => {
    const onDebouncedChange = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ value: "test", onDebouncedChange }),
    );

    act(() => {
      result.current.setLocalValue("test");
    });

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();
  });

  it("respects custom debounceMs", () => {
    const onDebouncedChange = vi.fn();
    const customDelay = 500;
    const { result } = renderHook(() =>
      useDebouncedSearch({
        value: "",
        onDebouncedChange,
        debounceMs: customDelay,
      }),
    );

    act(() => {
      result.current.setLocalValue("custom");
    });

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    expect(onDebouncedChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(customDelay - SEARCH_DEBOUNCE_MS);
    });

    expect(onDebouncedChange).toHaveBeenCalledTimes(1);
    expect(onDebouncedChange).toHaveBeenCalledWith("custom");
  });
});
