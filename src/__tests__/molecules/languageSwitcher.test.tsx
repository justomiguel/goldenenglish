import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { mockPathname } from "@/test/navigationMock";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const labels = { label: "Lang", es: "ES", en: "EN", pt: "PT" };

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/es");
  });

  it("renders locale navigation with three links", () => {
    mockPathname.mockReturnValue("/en");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    const nav = screen.getByRole("navigation", { name: labels.label });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^ES$/ })).toHaveAttribute("href", "/es");
    expect(screen.getByRole("link", { name: /^EN$/ })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: /^PT$/ })).toHaveAttribute("href", "/pt");
  });

  it("marks the active locale with aria-current=page", () => {
    mockPathname.mockReturnValue("/en/contact");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: /^EN$/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /^ES$/ })).not.toHaveAttribute("aria-current");
  });

  it("preserves nested path when switching locale", () => {
    mockPathname.mockReturnValue("/en/about/team");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: /^PT$/ })).toHaveAttribute(
      "href",
      "/pt/about/team",
    );
  });

  it("prefixes raw paths without a locale segment", () => {
    mockPathname.mockReturnValue("/raw/path");
    render(<LanguageSwitcher locale="en" labels={labels} />);
    expect(screen.getByRole("link", { name: /^ES$/ })).toHaveAttribute(
      "href",
      "/es/raw/path",
    );
  });

  it("compact variant still exposes three locale links", () => {
    mockPathname.mockReturnValue("/es");
    render(<LanguageSwitcher locale="es" labels={labels} variant="compact" />);
    expect(screen.getByRole("link", { name: /^EN$/ })).toHaveAttribute("href", "/en");
  });

  it("compactDark variant links preserve dashboard path", () => {
    mockPathname.mockReturnValue("/es/dashboard");
    render(<LanguageSwitcher locale="es" labels={labels} variant="compactDark" />);
    expect(screen.getByRole("link", { name: /^PT$/ })).toHaveAttribute(
      "href",
      "/pt/dashboard",
    );
  });
});
