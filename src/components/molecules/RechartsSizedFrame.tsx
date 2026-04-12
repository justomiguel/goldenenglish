"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface RechartsSizedFrameProps {
  height: number;
  className?: string;
  children: (width: number, chartHeight: number) => ReactNode;
}

/**
 * Recharts `ResponsiveContainer` with `width="100%"` can measure -1 until the parent
 * has a non-zero width (flex, dynamic import). We measure first, then render.
 */
export function RechartsSizedFrame({ height, className, children }: RechartsSizedFrameProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measure);
    });
    return () => {
      window.cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className ?? "w-full min-w-0"}
      style={{ minHeight: height }}
    >
      {width > 0 ? children(Math.max(width, 1), height) : null}
    </div>
  );
}
