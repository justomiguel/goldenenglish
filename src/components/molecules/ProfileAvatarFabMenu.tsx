"use client";

import { forwardRef, useCallback, useLayoutEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

const GAP_PX = 10;
const VIEW_MARGIN = 12;
const MENU_MAX_W = 360;

export interface ProfileAvatarFabMenuProps {
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** Fixed portal below anchor, clamped to viewport (escapes overflow:hidden ancestors). Mount only while open. */
export const ProfileAvatarFabMenu = forwardRef<HTMLDivElement, ProfileAvatarFabMenuProps>(
  function ProfileAvatarFabMenu({ anchorRef, children }, ref) {
    const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

    const measure = useCallback(() => {
      const el = anchorRef.current;
      if (!el) {
        setBox(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const width = Math.min(MENU_MAX_W, Math.max(200, vw - VIEW_MARGIN * 2));
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(VIEW_MARGIN, Math.min(left, vw - VIEW_MARGIN - width));
      setBox({
        top: rect.bottom + GAP_PX,
        left,
        width,
      });
    }, [anchorRef]);

    useLayoutEffect(() => {
      const id = requestAnimationFrame(() => {
        measure();
      });
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
      };
    }, [measure]);

    if (!box || typeof document === "undefined") return null;

    return createPortal(
      <div
        ref={ref}
        role="menu"
        style={{
          position: "fixed",
          top: box.top,
          left: box.left,
          width: box.width,
          zIndex: 200,
        }}
        className="rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_22%,var(--color-border))] bg-[var(--color-surface)] py-1 shadow-lg ring-1 ring-[color-mix(in_srgb,var(--color-accent)_26%,transparent)]"
      >
        {children}
      </div>,
      document.body,
    );
  },
);

ProfileAvatarFabMenu.displayName = "ProfileAvatarFabMenu";
