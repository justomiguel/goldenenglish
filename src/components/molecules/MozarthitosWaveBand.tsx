import { MozarthitosWaveDivider } from "@/components/organisms/MozarthitosWaveDivider";

export interface MozarthitosWaveBandProps {
  /**
   * Fondo opaco bajo el SVG: debe igualar la masa del bloque que debe verse en los huecos
   * del path (normalmente el color de la sección siguiente).
   */
  backingClassName: string;
  fillClassName: string;
  flipVertical?: boolean;
  mirrorHorizontal?: boolean;
}

/**
 * Coloca una onda al borde superior de una sección (solapa la anterior con `-mt` en la section).
 * Sin backing opaco, la transparencia del SVG filtra el fondo equivocado y aparecen “huecos”.
 */
export function MozarthitosWaveBand({
  backingClassName,
  fillClassName,
  flipVertical = false,
  mirrorHorizontal = true,
}: MozarthitosWaveBandProps) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[52px] w-full -translate-y-[calc(100%-2px)] overflow-hidden leading-none md:h-[112px]",
        backingClassName,
      ].join(" ")}
      aria-hidden
    >
      <MozarthitosWaveDivider
        className="-mb-px h-full w-full"
        fillClassName={fillClassName}
        flipVertical={flipVertical}
        mirrorHorizontal={mirrorHorizontal}
        svgClassName="relative block h-full w-full min-h-0"
      />
    </div>
  );
}
