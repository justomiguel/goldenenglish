import type { ReactNode } from "react";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "@/styles/nagoLanding.css";

const nagoDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-display",
  display: "swap",
  adjustFontFallback: true,
});

const nagoBody = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-body",
  display: "swap",
});

export interface NagoFontRootProps {
  className?: string;
  children: ReactNode;
}

export function NagoFontRoot({ className = "", children }: NagoFontRootProps) {
  const vars = `${nagoDisplay.variable} ${nagoBody.variable}`;
  return (
    <div
      className={`nago-landing ${vars} bg-[var(--color-background)] font-[family-name:var(--font-nago-body)] text-[var(--nago-ink)] antialiased ${className}`.trim()}
    >
      {children}
    </div>
  );
}
