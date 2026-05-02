import type { ReactNode } from "react";

/**
 * Divisor ondulado entre secciones (paridad mozarthitos.cl / Elementor).
 *
 * El path antiguo cerraba solo una banda superior → transparente debajo y parecía
 * una “cinta” sobre el hero. Este path rellena todo el trapecio bajo la curva
 * hasta y=100 para que el color sea masa continua hasta la siguiente sección.
 */

export const MZ_WAVE_SVG_CLASS =
  "relative block h-[52px] w-full md:h-[112px]" as const;

export function MozarthitosWaveDivider({
  className = "",
  fillClassName = "fill-[var(--color-muted)]/25",
  svgClassName = MZ_WAVE_SVG_CLASS,
  /** Igual que Elementor: rotateY(180deg) → espejo horizontal del path */
  mirrorHorizontal = true,
  /** Volteo vertical del dibujo (hero → “muerde” hacia arriba como en el sitio de referencia) */
  flipVertical = false,
}: {
  className?: string;
  fillClassName?: string;
  svgClassName?: string;
  mirrorHorizontal?: boolean;
  flipVertical?: boolean;
}) {
  const path = (
    <path
      className={fillClassName}
      d="M0 34 C216 82 396 14 576 48 C756 88 936 20 1116 54 C1248 76 1368 36 1440 32 L1440 100 L0 100 Z"
    />
  );

  let graphic: ReactNode = path;
  if (mirrorHorizontal) {
    graphic = <g transform="translate(1440 0) scale(-1 1)">{graphic}</g>;
  }
  if (flipVertical) {
    graphic = <g transform="translate(0 100) scale(1 -1)">{graphic}</g>;
  }

  return (
    <div
      className={[
        "pointer-events-none relative -mb-px w-full overflow-hidden leading-none",
        className,
      ].join(" ")}
      aria-hidden
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={[svgClassName, "block w-[calc(100%+2px)] max-w-none -translate-x-px"].join(
          " ",
        )}
      >
        {graphic}
      </svg>
    </div>
  );
}
