import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemplateThumbCta } from "@/components/organisms/generic-landing/TemplateThumbCta";

const surface = vi.hoisted(() => ({ current: "web-mobile" as "web-mobile" | "web-desktop" | "pwa-mobile" }));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => surface.current,
}));

describe("TemplateThumbCta", () => {
  it("pins the contact action on the phone and in the installed app", () => {
    surface.current = "pwa-mobile";
    render(<TemplateThumbCta label="Pide una clase" />);
    expect(screen.getByRole("link", { name: "Pide una clase" })).toHaveAttribute("href", "#contacto");
  });

  it("stays out of the wide desktop layout", () => {
    surface.current = "web-desktop";
    render(<TemplateThumbCta label="Pide una clase" />);
    expect(screen.queryByRole("link", { name: "Pide una clase" })).not.toBeInTheDocument();
  });
});
