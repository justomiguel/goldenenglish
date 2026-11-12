import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/styles/mozarthitosLanding.css";

const display = CATALOG_FONTS["baloo-2"];
const body = CATALOG_FONTS["dm-sans"];

export interface MozarthitosFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MozarthitosFontRoot({ className = "", children }: MozarthitosFontRootProps) {
  const vars = `${display.variable} ${body.variable}`;
  return (
    <div
      className={`mz-landing relative max-w-[100vw] overflow-x-hidden bg-[var(--mz-white)] ${vars} ${className}`.trim()}
    >
      <style>{".mz-landing{--font-mz-display:var(--font-catalog-baloo-2);--font-mz-body:var(--font-catalog-dm-sans)}"}</style>
      {children}
    </div>
  );
}
