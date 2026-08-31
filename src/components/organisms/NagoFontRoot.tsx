import type { ReactNode } from "react";
import { Oswald, Outfit } from "next/font/google";
import "@/styles/nagoLanding.css";
import { NagoSoundRoot } from "@/components/organisms/NagoSoundRoot";

const nagoDisplay = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-display",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const nagoBody = Outfit({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-nago-body",
  display: "swap",
  preload: false,
});

export interface NagoFontRootProps {
  className?: string;
  /** Berimbau context. Off on login/auth so the sheet is tokens-only. */
  sound?: boolean;
  children: ReactNode;
}

export function NagoFontRoot({ className = "", sound = true, children }: NagoFontRootProps) {
  const vars = `${nagoDisplay.variable} ${nagoBody.variable}`;
  return (
    <div
      className={`nago-landing ${vars} bg-[var(--nago-bg)] font-[family-name:var(--font-nago-body)] text-[var(--nago-ink)] antialiased ${className}`.trim()}
    >
      <div className="nago-grain" aria-hidden />
      {sound ? <NagoSoundRoot>{children}</NagoSoundRoot> : children}
    </div>
  );
}
