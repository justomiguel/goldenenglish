import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/RegisterEspacioZenitSurface", () => ({
  RegisterEspacioZenitSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="espaciozenit">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterMozarthitosSurface", () => ({
  RegisterMozarthitosSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="mozarthitos">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterNagoSurface", () => ({
  RegisterNagoSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="nago">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterMiMundoSurface", () => ({
  RegisterMiMundoSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="mimundo">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterLioraSurface", () => ({
  RegisterLioraSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="liora">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));
vi.mock("@/components/organisms/RegisterClassicSurface", () => ({
  RegisterClassicSurface: (p: { enrollmentLink?: { token: string } }) => (
    <div data-testid="classic">{p.enrollmentLink?.token ?? "no-link"}</div>
  ),
}));

const shellProps = {
  locale: "es",
  dict: { register: {}, login: { title: "Entrar" }, landing: {}, common: {} },
  brand: { name: "X", logoPath: "/logo.png", logoAlt: "X" },
  legalAgeMajority: 18,
  sectionOptions: [],
} as never;

async function renderDispatch(props: Record<string, unknown>) {
  const { RegisterSurfaceByTemplate } = await import(
    "@/components/organisms/RegisterSurfaceByTemplate"
  );
  return render(<RegisterSurfaceByTemplate {...shellProps} {...props} />);
}

describe("RegisterSurfaceByTemplate", () => {
  for (const kind of [
    "espaciozenit",
    "mozarthitos",
    "nago",
    "mimundo",
    "liora",
    "classic",
  ]) {
    it(`renders the ${kind} surface`, async () => {
      await renderDispatch({ templateKind: kind });
      expect(screen.getByTestId(kind)).toBeInTheDocument();
    });
  }

  it("falls back to classic for an unknown template kind", async () => {
    await renderDispatch({ templateKind: "brand-new-tenant" });
    expect(screen.getByTestId("classic")).toBeInTheDocument();
  });

  it("forwards the enrollment link to every branded surface", async () => {
    for (const kind of [
      "espaciozenit",
      "mozarthitos",
      "nago",
      "mimundo",
      "liora",
      "classic",
    ]) {
      const { unmount } = await renderDispatch({
        templateKind: kind,
        enrollmentLink: { token: "tok-123" },
      });
      expect(screen.getByTestId(kind)).toHaveTextContent("tok-123");
      unmount();
    }
  });
});
