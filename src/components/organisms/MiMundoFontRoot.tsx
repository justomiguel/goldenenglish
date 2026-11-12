import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/styles/mimundoLanding.css";

const display = CATALOG_FONTS.fraunces;
const body = CATALOG_FONTS.nunito;
const accent = CATALOG_FONTS.caveat;

export interface MiMundoFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MiMundoFontRoot({ className = "", children }: MiMundoFontRootProps) {
  const vars = `${display.variable} ${body.variable} ${accent.variable}`;
  return (
    <div
      className={`mimundo-landing ${vars} bg-[var(--mm-cream)] font-[family-name:var(--font-mm-body)] text-[var(--mm-ink)] antialiased ${className}`.trim()}
    >
      <style>{".mimundo-landing{--font-mm-display:var(--font-catalog-fraunces);--font-mm-body:var(--font-catalog-nunito);--font-mm-accent:var(--font-catalog-caveat)}"}</style>
      {children}
    </div>
  );
}
