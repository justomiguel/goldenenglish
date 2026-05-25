import type { ReactNode } from "react";
import { Fraunces, Nunito, Caveat } from "next/font/google";
import "@/styles/mimundoLanding.css";

const mmDisplay = Fraunces({
  weight: ["600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mm-display",
  display: "swap",
  adjustFontFallback: true,
});

const mmBody = Nunito({
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mm-body",
  display: "swap",
  adjustFontFallback: true,
});

const mmAccent = Caveat({
  weight: ["400"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mm-accent",
  display: "swap",
});

export interface MiMundoFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MiMundoFontRoot({
  className = "",
  children,
}: MiMundoFontRootProps) {
  const vars = `${mmDisplay.variable} ${mmBody.variable} ${mmAccent.variable}`;
  return (
    <div
      className={`mimundo-landing ${vars} bg-[var(--mm-cream)] font-[family-name:var(--font-mm-body)] text-[var(--mm-ink)] antialiased ${className}`.trim()}
    >
      {children}
    </div>
  );
}
