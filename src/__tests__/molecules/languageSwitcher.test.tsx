import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { mockPathname } from "@/test/navigationMock";

const labels = { label: "Lang", es: "ES", en: "EN" };

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/es");
  });

  it("maps bare locale path to root slug", () => {
    mockPathname.mockReturnValue("/en");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: "ES" })).toHaveAttribute(
      "href",
      "/es",
    );
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute(
      "href",
      "/en",
    );
  });

  it("strips locale prefix from nested path", () => {
    mockPathname.mockReturnValue("/en/about/team");
    render(<LanguageSwitcher locale="es" labels={labels} />);
    expect(screen.getByRole("link", { name: /es/i })).toHaveAttribute(
      "href",
      "/es/about/team",
    );
  });

  it("leaves pathname unchanged when no locale prefix", () => {
    mockPathname.mockReturnValue("/raw/path");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: /es/i })).toHaveAttribute(
      "href",
      "/es/raw/path",
    );
  });
});
