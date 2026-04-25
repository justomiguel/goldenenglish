"use client";

import { useEffect, useRef } from "react";

export function useTaskEngagementTimer(input: {
  enabled: boolean;
  delayMs?: number;
  onEngaged: () => void;
}): void {
  const sentRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!input.enabled || sentRef.current) return;
    const clear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    const schedule = () => {
      clear();
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      timerRef.current = setTimeout(() => {
        if (sentRef.current) return;
        if (document.visibilityState !== "visible" || !document.hasFocus()) return;
        sentRef.current = true;
        input.onEngaged();
      }, input.delayMs ?? 5000);
    };

    schedule();
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("focus", schedule);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("focus", schedule);
      window.removeEventListener("blur", clear);
    };
  }, [input]);
}
