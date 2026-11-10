import type { ReactNode } from "react";
import { Fraunces, Nunito } from "next/font/google";
import "@/styles/matissLanding.css";
import "@/styles/matissPhoneSections.css";

const matissDisplay = Fraunces({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-matiss-display",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const matissBody = Nunito({
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-matiss-body",
  display: "swap",
  preload: false,
});

export interface MatissFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MatissFontRoot({ className = "", children }: MatissFontRootProps) {
  const vars = `${matissDisplay.variable} ${matissBody.variable}`;
  return (
    <div
      className={`matiss-landing ${vars} bg-[var(--matiss-paper)] font-[family-name:var(--font-matiss-body)] text-[var(--matiss-ink)] antialiased ${className}`.trim()}
    >
      {children}
    </div>
  );
}
