import type { ReactNode } from "react";
import { Allura, Jost, Playfair_Display } from "next/font/google";
import "@/styles/lioraLanding.css";
import "@/styles/lioraLandingBlocks.css";
import "@/styles/lioraRibbon.css";

const lioraDisplay = Playfair_Display({
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-liora-display",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const lioraScript = Allura({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-liora-script",
  display: "swap",
  preload: false,
});

const lioraBody = Jost({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-liora-body",
  display: "swap",
  preload: false,
});

export interface LioraFontRootProps {
  className?: string;
  children: ReactNode;
}

export function LioraFontRoot({ className = "", children }: LioraFontRootProps) {
  const vars = `${lioraDisplay.variable} ${lioraScript.variable} ${lioraBody.variable}`;
  return (
    <div
      className={`liora-landing ${vars} bg-[var(--liora-cream)] font-[family-name:var(--font-liora-body)] text-[var(--liora-ink)] antialiased ${className}`.trim()}
    >
      {children}
    </div>
  );
}
