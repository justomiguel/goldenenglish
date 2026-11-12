import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render } from "@testing-library/react";

vi.mock("@/components/atoms/fonts/catalogFonts", () => {
  const face = (id: string) => ({
    className: `cls-${id}`,
    variable: `--font-catalog-${id}`,
  });
  return {
    CATALOG_FONTS: new Proxy(
      {},
      { get: (_target, prop) => face(String(prop)) },
    ),
  };
});

import { EspacioZenitFontRoot } from "@/components/organisms/EspacioZenitFontRoot";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { MatissFontRoot } from "@/variants/owned/matiss/font/v1/Web";
import { MiMundoFontRoot } from "@/components/organisms/MiMundoFontRoot";
import { MozarthitosFontRoot } from "@/components/organisms/MozarthitosFontRoot";
import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

describe("bespoke font roots", () => {
  it("puts the catalog variable classes on each landing root", () => {
    const cases: Array<{ node: ReactNode; classes: string[] }> = [
      {
        node: <NagoFontRoot><p>Nagô</p></NagoFontRoot>,
        classes: ["--font-catalog-oswald", "--font-catalog-outfit"],
      },
      {
        node: <LioraFontRoot><p>Liora</p></LioraFontRoot>,
        classes: ["--font-catalog-playfair-display", "--font-catalog-allura", "--font-catalog-jost"],
      },
      {
        node: <MatissFontRoot><p>Matiss</p></MatissFontRoot>,
        classes: ["--font-catalog-fraunces", "--font-catalog-nunito"],
      },
      {
        node: <MiMundoFontRoot><p>Mi Mundo</p></MiMundoFontRoot>,
        classes: ["--font-catalog-fraunces", "--font-catalog-nunito", "--font-catalog-caveat"],
      },
      {
        node: <MozarthitosFontRoot><p>Mozarthitos</p></MozarthitosFontRoot>,
        classes: ["--font-catalog-baloo-2", "--font-catalog-dm-sans"],
      },
      {
        node: (
          <EspacioZenitFontRoot>
            <p>Zenit</p>
          </EspacioZenitFontRoot>
        ),
        classes: ["--font-catalog-espaciozenit-fast-blaze", "--font-catalog-plus-jakarta-sans"],
      },
    ];

    for (const item of cases) {
      const { container, unmount } = render(item.node);
      const root = container.firstElementChild;
      for (const className of item.classes) {
        expect(root?.className).toContain(className);
      }
      unmount();
    }
  });
});
