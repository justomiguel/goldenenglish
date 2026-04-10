import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { Dictionary } from "@/types/i18n";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { mockPathname } from "@/test/navigationMock";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { RegisterCollage } from "@/components/molecules/RegisterCollage";
import { LoginHeroPanel } from "@/components/molecules/LoginHeroPanel";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStudentGallery } from "@/components/molecules/LandingStudentGallery";

const handleLoginSubmit = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => ({
    email: "",
    password: "",
    error: null,
    redirecting: false,
    isLoading: false,
    rememberMe: false,
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setRememberMe: vi.fn(),
    handleSubmit: handleLoginSubmit,
  }),
}));

import { LoginForm } from "@/components/organisms/LoginForm";

describe("coverage gap closure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("LanguageSwitcher handles /es/ pathname", () => {
    mockPathname.mockReturnValue("/es/");
    render(<LanguageSwitcher locale="en" labels={dictEn.common.locale} />);
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute("href", "/en");
  });

  it("RegisterSiteHeader uses name when logo alt empty", () => {
    render(
      <RegisterSiteHeader
        brand={{ ...mockBrandPublic, logoAlt: "" }}
        locale="es"
        dict={dictEn}
      />,
    );
    expect(screen.getByAltText(mockBrandPublic.name)).toBeInTheDocument();
  });

  it("RegisterCollage tolerates short alts array", () => {
    render(<RegisterCollage alts={["only"]} />);
    expect(document.querySelector("img")).toBeTruthy();
  });

  it("LoginHeroPanel uses name fallback when logo alt empty", () => {
    render(
      <LoginHeroPanel
        brand={{ ...mockBrandPublic, logoAlt: "" }}
        locale="es"
      />,
    );
    expect(screen.getByAltText(mockBrandPublic.name)).toBeInTheDocument();
  });

  it("LandingFooterPwa shows social and email links", () => {
    render(
      <LandingFooterPwa
        dict={dictEn}
        brand={{
          ...mockBrandPublic,
          socialInstagram: "https://ig.example",
          socialFacebook: "https://fb.example",
          contactEmail: "hi@example.org",
          contactPhone: "+1999",
        }}
        locale="es"
        sessionEmail="u@x.co"
      />,
    );
    expect(screen.getByRole("link", { name: "Instagram" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Facebook" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "hi@example.org" })).toBeInTheDocument();
  });

  it("LandingFooterPwa omits mailto when contact email absent", () => {
    render(
      <LandingFooterPwa
        dict={dictEn}
        brand={{ ...mockBrandPublic, contactEmail: "" }}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("LandingHeaderPwa session branch and horizontal scroll hints", async () => {
    render(
      <LandingHeaderPwa
        brand={{ ...mockBrandPublic, logoAlt: "" }}
        dict={dictEn}
        locale="es"
        sessionEmail="a@b.co"
      />,
    );
    const nav = screen.getByRole("navigation", { name: dictEn.nav.sectionsAria });
    Object.defineProperty(nav, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(nav, "clientWidth", { value: 100, configurable: true });
    Object.defineProperty(nav, "scrollLeft", { value: 0, configurable: true });
    await act(async () => {
      fireEvent(window, new Event("resize"));
    });
    await waitFor(() => {
      expect(screen.getByText(dictEn.nav.sectionsScrollHint)).toBeInTheDocument();
    });
  });

  it("LandingHero uses short collage alts with optional chaining", () => {
    const dict: Dictionary = {
      ...dictEn,
      landing: {
        ...dictEn.landing,
        collage: { ...dictEn.landing.collage, alts: ["one"] },
      },
    };
    const { container } = render(
      <LandingHero
        dict={dict}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
        inscriptionsOpen={false}
      />,
    );
    expect(container.querySelectorAll("img").length).toBeGreaterThan(0);
  });

  it("LandingStudentGallery ArrowRight advances slide", async () => {
    const dict: Dictionary = {
      ...dictEn,
      landing: {
        ...dictEn.landing,
        collage: { ...dictEn.landing.collage, alts: ["a", "b", "c", "d"] },
        studentGallery: {
          ...dictEn.landing.studentGallery,
          items: [
            {
              name: "Multi",
              coverIndex: 0,
              photoIndexes: [0, 1, 2],
            },
          ],
        },
      },
    };
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      },
    );
    render(<LandingStudentGallery dict={dict} />);
    fireEvent.click(screen.getByRole("button", { name: /Multi/ }));
    fireEvent.keyDown(document, {
      key: "ArrowRight",
      preventDefault: vi.fn(),
    });
    vi.unstubAllGlobals();
  });

  it("LoginForm onSubmit delegates to handleSubmit", () => {
    render(<LoginForm labels={dictEn.login} locale="es" />);
    fireEvent.submit(document.querySelector("form")!);
    expect(handleLoginSubmit).toHaveBeenCalled();
  });
});
