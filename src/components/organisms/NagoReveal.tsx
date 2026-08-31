"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface NagoRevealProps {
  children: ReactNode;
  className?: string;
  delay?: 1 | 2 | 3;
  as?: "div" | "article";
  variant?: "block" | "media" | "mask";
  from?: "up" | "left" | "right";
  drift?: number;
}

export function NagoReveal({
  children,
  className = "",
  delay,
  as: Tag = "div",
  variant = "block",
  from = "up",
  drift,
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

  const fromClass = variant !== "mask" && from !== "up" ? ` nago-reveal-from-${from}` : "";
  const variantClass =
    variant === "media" ? " nago-reveal-media" : variant === "mask" ? " nago-reveal-mask" : "";
  const revealClass = `nago-reveal${variantClass}${fromClass}${on ? " is-in" : ""}${delay ? ` d${delay}` : ""}${className ? ` ${className}` : ""}`;

  let body: ReactNode = children;
  if (variant !== "mask" && drift != null && drift !== 0) {
    body = (
      <div className="nago-scroll-drift" data-nago-drift={drift}>
        {children}
      </div>
    );
  }
  if (variant === "media") {
    body = <div className="nago-reveal-media-frame">{body}</div>;
  }
  if (variant === "mask") {
    body = <div className="nago-reveal-mask-inner">{body}</div>;
  }

  if (Tag === "article") {
    return (
      <article ref={ref} className={revealClass}>
        {body}
      </article>
    );
  }

  return (
    <div ref={ref} className={revealClass}>
      {body}
    </div>
  );
}
