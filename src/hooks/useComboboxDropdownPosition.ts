"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

export type ComboboxDropdownRect = { top: number; left: number; width: number };

/**
 * Viewport-fixed coordinates for a dropdown anchored below an input (scroll/resize aware).
 */
export function useComboboxDropdownPosition(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
): ComboboxDropdownRect | null {
  const [rect, setRect] = useState<ComboboxDropdownRect | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    function measure() {
      const el = inputRef.current;
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom, left: r.left, width: r.width });
    }
    measure();
    const w = typeof window !== "undefined" ? window : undefined;
    if (!w) return;
    w.addEventListener("resize", measure);
    w.addEventListener("scroll", measure, true);
    return () => {
      w.removeEventListener("resize", measure);
      w.removeEventListener("scroll", measure, true);
    };
  }, [open, inputRef]);

  return open ? rect : null;
}
