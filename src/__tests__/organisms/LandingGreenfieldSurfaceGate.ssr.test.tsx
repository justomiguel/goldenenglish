import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));

vi.mock("@/components/organisms/LandingGreenfieldHeader", () => ({
  LandingGreenfieldHeader: () => <header>gf-header</header>,
}));

vi.mock("@/components/organisms/LandingGreenfieldFooter", () => ({
  LandingGreenfieldFooter: () => <footer>gf-footer</footer>,
}));

vi.mock("@/components/pwa/molecules/PwaPageShell", () => ({
  PwaPageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import { LandingGreenfieldSurfaceGate } from "@/components/organisms/LandingGreenfieldSurfaceGate";

describe("LandingGreenfieldSurfaceGate SSR", () => {
  it("paints main on the server instead of the loading skeleton", () => {
    const html = renderToString(
      <LandingGreenfieldSurfaceGate
        main={<main><h1>Setup pending</h1></main>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(html).toContain("Setup pending");
    expect(html).not.toContain(dictEn.common.loadingAria);
    expect(html).not.toContain("aria-busy");
  });
});
