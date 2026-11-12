import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/styles/nagoLanding.css";
import { NagoSoundRoot } from "@/components/organisms/NagoSoundRoot";

const display = CATALOG_FONTS.oswald;
const body = CATALOG_FONTS.outfit;

export interface NagoFontRootProps {
  className?: string;
  /** Berimbau context. Off on login/auth so the sheet is tokens-only. */
  sound?: boolean;
  children: ReactNode;
}

export function NagoFontRoot({ className = "", sound = true, children }: NagoFontRootProps) {
  const vars = `${display.variable} ${body.variable}`;
  return (
    <div
      className={`nago-landing ${vars} bg-[var(--nago-bg)] font-[family-name:var(--font-nago-body)] text-[var(--nago-ink)] antialiased ${className}`.trim()}
    >
      <style>{".nago-landing{--font-nago-display:var(--font-catalog-oswald);--font-nago-body:var(--font-catalog-outfit)}"}</style>
      <div className="nago-grain" aria-hidden />
      {sound ? <NagoSoundRoot>{children}</NagoSoundRoot> : children}
    </div>
  );
}
