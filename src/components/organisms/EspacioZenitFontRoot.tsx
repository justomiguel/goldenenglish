import type { ReactNode } from "react";
import localFont from "next/font/local";
import {
  Bebas_Neue,
  Cormorant_Garamond,
  Pacifico,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "@/styles/mozarthitosLanding.css";
import "@/styles/espaciozenitLanding.css";

const ezHeroBrush = localFont({
  src: "../../../public/fonts/FAST BLAZE.otf",
  variable: "--font-ez-fast-blaze",
  display: "swap",
});

const ezDisciplineHiphop = localFont({
  src: "../../../public/fonts/Rusted Vibe.otf",
  variable: "--font-ez-rusted-vibe",
  display: "swap",
});

const ezDisciplineBallet = localFont({
  src: "../../../public/fonts/Ballet.otf",
  variable: "--font-ez-ballet-display",
  display: "swap",
});

const ezBrush = Pacifico({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-brush",
  display: "swap",
  adjustFontFallback: true,
});

const ezSerif = Cormorant_Garamond({
  weight: ["500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-serif",
  display: "swap",
  adjustFontFallback: true,
});

const ezDisplay = Bebas_Neue({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-display",
  display: "swap",
});

const ezBody = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ez-body",
  display: "swap",
});

export interface EspacioZenitFontRootProps {
  /** Clases aplicadas junto al bloque ez/mz (ej. layout de página vs main landing). */
  className?: string;
  children: ReactNode;
}

export function EspacioZenitFontRoot({
  className = "",
  children,
}: EspacioZenitFontRootProps) {
  const fontVars = [
    ezHeroBrush.variable,
    ezDisciplineHiphop.variable,
    ezDisciplineBallet.variable,
    ezBrush.variable,
    ezSerif.variable,
    ezDisplay.variable,
    ezBody.variable,
  ].join(" ");

  return (
    <div className={`ez-landing mz-landing ${fontVars} ${className}`.trim()}>
      {children}
    </div>
  );
}
