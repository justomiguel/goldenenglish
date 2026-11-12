import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/variants/owned/matiss/styles/landing.css";
import "@/variants/owned/matiss/styles/phone.css";

const display = CATALOG_FONTS.fraunces;
const body = CATALOG_FONTS.nunito;

export interface MatissFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MatissFontRoot({ className = "", children }: MatissFontRootProps) {
  const vars = `${display.variable} ${body.variable}`;
  return (
    <div
      className={`matiss-landing ${vars} bg-[var(--ds-color-background)] font-[family-name:var(--ds-font-body)] text-[var(--ds-color-foreground)] antialiased ${className}`.trim()}
    >
      <style>{".matiss-landing{--ds-font-heading:var(--font-catalog-fraunces);--ds-font-body:var(--font-catalog-nunito)}"}</style>
      {children}
    </div>
  );
}

export default MatissFontRoot;
