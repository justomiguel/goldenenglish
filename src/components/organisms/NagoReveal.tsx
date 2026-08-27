"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface NagoRevealProps {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3;
  as?: "div" | "article";
  variant?: "block" | "media";
}

export function NagoReveal({
  children,
  className = "",
  delay,
  as: Tag = "div",
  variant = "block",
}: NagoRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setOn(true);
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const revealClass = `nago-reveal${variant === "media" ? " nago-reveal-media" : ""}${on ? " is-in" : ""}${delay ? ` d${delay}` : ""}${className ? ` ${className}` : ""}`;

  if (Tag === "article") {
    return (
      <article ref={ref} className={revealClass}>
        {children}
      </article>
    );
  }

  return (
    <div ref={ref} className={revealClass}>
      {children}
    </div>
  );
}
