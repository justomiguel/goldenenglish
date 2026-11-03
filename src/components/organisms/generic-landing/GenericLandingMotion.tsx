"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./genericLanding.module.css";

type Phase = "boot" | "wait" | "shown";

export function GenericLandingMotion({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("boot");

  useEffect(() => {
    const node = ref.current;
    let observer: IntersectionObserver | undefined;
    const frame = window.requestAnimationFrame(() => {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      if (reduce || !node) {
        setPhase("shown");
        return;
      }
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) {
        setPhase("shown");
        return;
      }
      setPhase("wait");
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setPhase("shown");
            observer?.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(node);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  const style: CSSProperties | undefined =
    phase === "shown" ? { transitionDelay: `${index * 70}ms` } : undefined;
  const motionClass = phase === "wait" ? styles.wait : phase === "shown" ? styles.shown : "";

  return (
    <div ref={ref} data-generic-motion={phase} className={`${motionClass} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
