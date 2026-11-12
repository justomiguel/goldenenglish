import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VariantSurfaceEntry } from "@/components/organisms/VariantSurfaceEntry";

const surface = vi.hoisted(() => ({ current: "web-desktop" }));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => surface.current,
}));

vi.mock("@/variants/clientEntries", () => ({
  CLIENT_VARIANT_ENTRIES: {
    "nav.generic@1": {
      web: () => <p>web tree</p>,
      pwa: () => <p>pwa tree</p>,
    },
  },
}));

describe("VariantSurfaceEntry", () => {
  it("mounts only the web tree on a desktop surface", () => {
    surface.current = "web-desktop";
    render(<VariantSurfaceEntry variantKey="nav.generic@1" props={{}} />);
    expect(screen.getByText("web tree")).toBeInTheDocument();
    expect(screen.queryByText("pwa tree")).toBeNull();
  });

  it("mounts only the pwa tree on an installed phone", () => {
    surface.current = "pwa-mobile";
    render(<VariantSurfaceEntry variantKey="nav.generic@1" props={{}} />);
    expect(screen.getByText("pwa tree")).toBeInTheDocument();
    expect(screen.queryByText("web tree")).toBeNull();
  });
});
