import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/styles/lioraLanding.css";
import "@/styles/lioraLandingBlocks.css";
import "@/styles/lioraRibbon.css";

const display = CATALOG_FONTS["playfair-display"];
const script = CATALOG_FONTS.allura;
const body = CATALOG_FONTS.jost;

export interface LioraFontRootProps {
  className?: string;
  children: ReactNode;
}

export function LioraFontRoot({ className = "", children }: LioraFontRootProps) {
  const vars = `${display.variable} ${script.variable} ${body.variable}`;
  return (
    <div
      className={`liora-landing ${vars} bg-[var(--liora-cream)] font-[family-name:var(--font-liora-body)] text-[var(--liora-ink)] antialiased ${className}`.trim()}
    >
      <style>{".liora-landing{--font-liora-display:var(--font-catalog-playfair-display);--font-liora-script:var(--font-catalog-allura);--font-liora-body:var(--font-catalog-jost)}"}</style>
      {children}
    </div>
  );
}
