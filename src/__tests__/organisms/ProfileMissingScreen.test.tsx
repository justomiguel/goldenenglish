import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import type { BrandPublic } from "@/lib/brand/server";
import { ProfileMissingScreen } from "@/components/organisms/ProfileMissingScreen";

const brand: BrandPublic = {
  name: "Test Institute",
  legalName: "Test Institute Legal",
  tagline: "Learn well",
  taglineEn: "Learn well",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "Logo",
  faviconPath: "/favicon.ico",
  contactEmail: "help@example.com",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

describe("ProfileMissingScreen", () => {
  it("renders title, steps, and actions", () => {
    render(
      <ProfileMissingScreen
        locale="en"
        brand={brand}
        labels={en.dashboard.myProfile}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      en.dashboard.myProfile.profileMissingTitle,
    );
    expect(screen.getByRole("button", { name: en.dashboard.myProfile.profileMissingSignOutCta })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: en.dashboard.myProfile.profileMissingHomeCta })).toHaveAttribute(
      "href",
      "/en",
    );
    expect(screen.getByRole("link", { name: /Email support/i })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:help%40example.com"),
    );
  });
});
