import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/components/organisms/NagoFontRoot", () => ({
  NagoFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/organisms/LioraFontRoot", () => ({
  LioraFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/organisms/MiMundoFontRoot", () => ({
  MiMundoFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/organisms/MozarthitosFontRoot", () => ({
  MozarthitosFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/organisms/EspacioZenitFontRoot", () => ({
  EspacioZenitFontRoot: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="ez-root" className={className}>
      {children}
    </div>
  ),
}));

import { PublicPrivacySurfaceByTemplate } from "@/components/organisms/PublicPrivacySurfaceByTemplate";

function renderSurface(templateKind: string) {
  return render(
    <PublicPrivacySurfaceByTemplate
      templateKind={templateKind}
      locale="es"
      dict={dictEn}
      brand={mockBrandPublic}
    />,
  );
}

describe("PublicPrivacySurfaceByTemplate", () => {
  it("exposes a main landmark labelled by the page title", () => {
    renderSurface("classic");
    expect(screen.getByRole("main")).toHaveAttribute("aria-labelledby", "privacy-page-title");
    expect(screen.getByRole("heading", { level: 1 })).toHaveAttribute("id", "privacy-page-title");
  });

  it("puts Nagô copy on the dark public sheet so tokens remap to gold and ink", () => {
    const { container } = renderSurface("nago");
    const sheet = container.querySelector(".nago-public-sheet");
    expect(sheet).toBeTruthy();
    expect(sheet?.className).toContain("nago-bg-2");
  });

  it("keeps Espacio Zenit on black with the cyan public sheet", () => {
    const { container } = renderSurface("espaciozenit");
    expect(screen.getByTestId("ez-root").className).toContain("bg-black");
    expect(container.querySelector(".ez-public-sheet")).toBeTruthy();
  });

  it("remaps Liora, Mi Mundo and Mozarthitos onto their landing tokens", () => {
    const liora = renderSurface("liora");
    expect(liora.container.querySelector(".liora-public-sheet")).toBeTruthy();
    liora.unmount();

    const mm = renderSurface("mimundo");
    expect(mm.container.querySelector(".mimundo-public-sheet")).toBeTruthy();
    mm.unmount();

    const mz = renderSurface("mozarthitos");
    expect(mz.container.querySelector(".mz-public-sheet")).toBeTruthy();
  });
});
