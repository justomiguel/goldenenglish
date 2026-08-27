import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));

vi.mock("@/components/desktop/organisms/LandingScreenDesktop", () => ({
  LandingScreenDesktop: ({ children }: { children: ReactNode }) => (
    <div data-testid="desktop-chrome">{children}</div>
  ),
}));

import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";

describe("LandingSurfaceGate SSR", () => {
  it("paints main on the server instead of the loading skeleton", () => {
    const html = renderToString(
      <LandingSurfaceGate
        main={<main><h1>Institute hero</h1></main>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(html).toContain("Institute hero");
    expect(html).not.toContain(dictEn.common.loadingAria);
    expect(html).not.toContain("aria-busy");
  });
});
