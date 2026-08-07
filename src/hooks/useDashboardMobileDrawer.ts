"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shared open state for dashboard chrome mobile nav drawers.
 * Escape + body scroll lock while open; close when viewport reaches Tailwind `md`.
 */
export function useDashboardMobileDrawer() {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  /** Tailwind `md` — close when widening so overlay is not left open while trigger is `md:hidden`. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => {
      if (mq.matches) close();
    };
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, [close]);

  return { open, openDrawer, close };
}
