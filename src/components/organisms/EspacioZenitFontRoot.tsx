import type { ReactNode } from "react";
import { CATALOG_FONTS } from "@/components/atoms/fonts/catalogFonts";
import "@/styles/mozarthitosLanding.css";
import "@/styles/espaciozenitLanding.css";

const faces = [
  CATALOG_FONTS["espaciozenit-fast-blaze"],
  CATALOG_FONTS["espaciozenit-rusted-vibe"],
  CATALOG_FONTS["espaciozenit-ballet"],
  CATALOG_FONTS.pacifico,
  CATALOG_FONTS["cormorant-garamond"],
  CATALOG_FONTS["bebas-neue"],
  CATALOG_FONTS["plus-jakarta-sans"],
];

export interface EspacioZenitFontRootProps {
  /** Clases aplicadas junto al bloque ez/mz (ej. layout de página vs main landing). */
  className?: string;
  children: ReactNode;
}

export function EspacioZenitFontRoot({ className = "", children }: EspacioZenitFontRootProps) {
  const fontVars = faces.map((face) => face.variable).join(" ");
  return (
    <div className={`ez-landing mz-landing ${fontVars} ${className}`.trim()}>
      <style>
        {".ez-landing{--font-ez-fast-blaze:var(--font-catalog-espaciozenit-fast-blaze);--font-ez-rusted-vibe:var(--font-catalog-espaciozenit-rusted-vibe);--font-ez-ballet-display:var(--font-catalog-espaciozenit-ballet);--font-ez-brush:var(--font-catalog-pacifico);--font-ez-serif:var(--font-catalog-cormorant-garamond);--font-ez-display:var(--font-catalog-bebas-neue);--font-ez-body:var(--font-catalog-plus-jakarta-sans)}"}
      </style>
      {children}
    </div>
  );
}
