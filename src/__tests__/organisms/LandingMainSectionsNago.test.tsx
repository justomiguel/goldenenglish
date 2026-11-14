import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/variants/owned/nago/pieces/NagoFontRoot", () => ({
  NagoFontRoot: ({ children }: { children: ReactNode }) => (
    <div className="nago-landing">{children}</div>
  ),
}));

vi.mock("@/variants/owned/nago/pieces/NagoSiteHeader", () => ({
  NagoSiteHeader: () => <header className="nago-site-header" />,
}));

vi.mock("@/variants/owned/nago/pieces/LandingNagoSections", () => ({
  LandingNagoSections: () => <div data-testid="nago-sections" />,
}));

import { LandingMainSectionsNago } from "@/variants/owned/nago/pieces/LandingMainSectionsNago";

describe("LandingMainSectionsNago", () => {
  it("keeps the header outside the overflow clip so photos cannot cover it", () => {
    const { container } = render(
      <LandingMainSectionsNago
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
      />,
    );

    const header = container.querySelector(".nago-site-header");
    const main = container.querySelector("main");
    expect(header).toBeTruthy();
    expect(main).toBeTruthy();
    expect(main?.contains(header)).toBe(false);
    expect(
      header &&
        main &&
        (header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) !==
          0,
    ).toBe(true);
  });
});
