import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => ({}),
  defaultLocale: "es",
  locales: ["es", "en", "pt"],
}));

vi.mock("@/lib/brand/resolvePublicBrand", () => ({
  resolvePublicBrand: async () => ({ logoPath: "/x.png", logoAlt: "Mark", name: "Institute" }),
  resolvePublicBrandWithSetup: async () => ({
    brand: { logoPath: "/x.png", logoAlt: "Mark", name: "Institute" },
    needsInitialSiteSetup: false,
    dict: {},
  }),
}));

vi.mock("@/lib/site/loadFirstRunWizardMode", () => ({
  loadFirstRunWizardMode: async () => "closed",
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));

vi.mock("@/lib/theme/loadActiveTheme", () => ({
  loadActiveTheme: async () => ({ theme: { templateKind: "nago", content: null } }),
}));

vi.mock("@/lib/settings/inscriptionsServer", () => ({
  getInscriptionsEnabled: async () => false,
}));

vi.mock("@/lib/auth/loadRequestSessionEmail", () => ({
  loadRequestSessionEmail: async () => null,
}));

vi.mock("@/lib/cms/applyLandingContentOverrides", () => ({
  applyLandingContentOverrides: (dict: unknown) => dict,
}));

vi.mock("@/components/organisms/PublicExperienceShell", () => ({
  PublicExperienceShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/organisms/PublicTenantChrome", () => ({
  PublicTenantChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/organisms/LoginScreenGate", () => ({
  LoginScreenGate: ({ brand }: { brand: { logoPath: string } }) => <img alt="logo" src={brand.logoPath} />,
}));

vi.mock("@/components/desktop/organisms/LoginScreenDesktop", () => ({
  LoginScreenDesktop: () => null,
}));

vi.mock("@/components/organisms/ForgotPasswordScreenGate", () => ({
  ForgotPasswordScreenGate: ({ brand }: { brand: { logoPath: string } }) => (
    <img alt="logo" src={brand.logoPath} />
  ),
}));

vi.mock("@/components/organisms/ResetPasswordScreenGate", () => ({
  ResetPasswordScreenGate: ({ brand }: { brand: { logoPath: string } }) => (
    <img alt="logo" src={brand.logoPath} />
  ),
}));

vi.mock("@/components/molecules/PublicFlowHeader", () => ({
  PublicFlowHeader: ({ logoSrc }: { logoSrc: string }) => <img alt="logo" src={logoSrc} />,
}));

import LoginPage from "@/app/[locale]/login/page";
import ForgotPasswordPage from "@/app/[locale]/forgot-password/page";
import ResetPasswordPage from "@/app/[locale]/reset-password/page";
import { PublicFlowFrame } from "@/components/organisms/PublicFlowFrame";

describe("auth chrome logo", () => {
  it("shows the brand logo on login", async () => {
    render(await LoginPage({ params: Promise.resolve({ locale: "es" }) }));
    expect(screen.getByRole("img", { name: "logo" })).toHaveAttribute("src", "/x.png");
  });

  it("shows the brand logo on forgot password", async () => {
    render(await ForgotPasswordPage({ params: Promise.resolve({ locale: "es" }) }));
    expect(screen.getByRole("img", { name: "logo" })).toHaveAttribute("src", "/x.png");
  });

  it("shows the brand logo on reset password", async () => {
    render(await ResetPasswordPage({ params: Promise.resolve({ locale: "es" }) }));
    expect(screen.getByRole("img", { name: "logo" })).toHaveAttribute("src", "/x.png");
  });

  it("shows the brand logo on the public flow frame", async () => {
    render(await PublicFlowFrame({ locale: "es", children: <p>Pay</p> }));
    expect(screen.getByRole("img", { name: "logo" })).toHaveAttribute("src", "/x.png");
  });
});
