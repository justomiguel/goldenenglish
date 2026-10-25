import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/components/organisms/PublicExperienceShell", () => ({
  PublicExperienceShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/organisms/PublicTenantChrome", () => ({
  PublicTenantChrome: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/brand/resolvePublicBrand", () => ({
  resolvePublicBrandWithSetup: async () => ({
    brand: mockBrandPublic,
    needsInitialSiteSetup: false,
    dict: dictEn,
  }),
}));

vi.mock("@/lib/theme/loadActiveTheme", () => ({
  loadActiveTheme: async () => ({ theme: { templateKind: "classic", content: null } }),
}));

vi.mock("@/lib/cms/applyLandingContentOverrides", () => ({
  applyLandingContentOverrides: (dict: unknown) => dict,
}));

vi.mock("@/lib/auth/loadRequestSessionEmail", () => ({
  loadRequestSessionEmail: async () => "parent@example.test",
}));

import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

describe("PublicFlowFrame", () => {
  it("renders the flow header and the page, not a blog sheet", async () => {
    render(await PublicFlowFrame({ locale: "es", children: <p>Pay the fee</p> }));

    expect(screen.getByRole("banner")).toHaveClass("public-marketing-chrome");
    expect(screen.getByRole("link", { name: dictEn.nav.myPortal })).toHaveAttribute(
      "href",
      "/es/dashboard",
    );
    expect(screen.getByText("Pay the fee")).toBeInTheDocument();
    expect(document.querySelector(".nago-public-sheet")).toBeNull();
  });
});
