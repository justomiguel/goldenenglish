import type { ReactNode } from "react";
import { Baloo_2, DM_Sans } from "next/font/google";
import "@/styles/mozarthitosLanding.css";

const mzDisplay = Baloo_2({
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mz-display",
  display: "swap",
});

const mzBody = DM_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-mz-body",
  display: "swap",
});

export interface MozarthitosFontRootProps {
  className?: string;
  children: ReactNode;
}

export function MozarthitosFontRoot({
  className = "",
  children,
}: MozarthitosFontRootProps) {
  const vars = `${mzDisplay.variable} ${mzBody.variable}`;
  return (
    <div
      className={`mz-landing relative max-w-[100vw] overflow-x-hidden bg-[var(--mz-white)] ${vars} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
