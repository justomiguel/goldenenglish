"use client";

import { useLayoutEffect, useRef } from "react";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

type RevealFrom = "up" | "left" | "right" | "depth" | "mask";

export interface PulsarRevealProps {
  from?: RevealFrom;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

export function PulsarReveal({ from = "up", delay = 0, className, children }: PulsarRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const play = () => {
      node.classList.remove(styles.pending);
      node.classList.add(styles.play);
    };
    if (node.getBoundingClientRect().top < window.innerHeight * 0.88) {
      play();
      return;
    }
    node.classList.add(styles.pending);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        play();
        observer.disconnect();
      },
      { threshold: 0.22 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${styles[from]} ${className ?? ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
