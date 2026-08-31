import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/NagoFontRoot", () => ({
  NagoFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="nago-font-root">{children}</div>
  ),
}));
vi.mock("@/components/organisms/LioraFontRoot", () => ({
  LioraFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="liora-font-root">{children}</div>
  ),
}));
vi.mock("@/components/organisms/MiMundoFontRoot", () => ({
  MiMundoFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="mm-font-root">{children}</div>
  ),
}));
vi.mock("@/components/organisms/MozarthitosFontRoot", () => ({
  MozarthitosFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="mz-font-root">{children}</div>
  ),
}));
vi.mock("@/components/organisms/EspacioZenitFontRoot", () => ({
  EspacioZenitFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="ez-font-root">{children}</div>
  ),
}));

import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";

describe("PublicTenantChrome", () => {
  it("wraps auth and public forms in the tenant font root", () => {
    const { rerender } = render(
      <PublicTenantChrome templateKind="nago">login</PublicTenantChrome>,
    );
    expect(screen.getByTestId("nago-font-root")).toHaveTextContent("login");

    rerender(<PublicTenantChrome templateKind="espaciozenit">ez</PublicTenantChrome>);
    expect(screen.getByTestId("ez-font-root")).toHaveTextContent("ez");

    rerender(<PublicTenantChrome templateKind="liora">liora</PublicTenantChrome>);
    expect(screen.getByTestId("liora-font-root")).toHaveTextContent("liora");
  });

  it("leaves classic on the site theme without a landing root", () => {
    render(<PublicTenantChrome templateKind="classic">plain</PublicTenantChrome>);
    expect(screen.queryByTestId("nago-font-root")).not.toBeInTheDocument();
    expect(screen.getByText("plain")).toBeInTheDocument();
  });
});
