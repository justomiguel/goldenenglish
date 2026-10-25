import { describe, expect, it } from "vitest";
import {
  NAGO_INSTALL_CHROME,
  bundledPublicInstallIcon,
  bundledPublicInstallManifestIcons,
  withAppleInstallIcon,
} from "@/lib/brand/bundledPublicInstallIcon";
import { NAGO_BUNDLED_LOGO } from "@/lib/landing/nagoLogo";

describe("bundledPublicInstallIcon", () => {
  it("uses the Nagô home mark and ignores the admin logo", () => {
    expect(bundledPublicInstallIcon("nago")).toBe(NAGO_BUNDLED_LOGO);
    expect(NAGO_INSTALL_CHROME).toBe("#070707");
  });

  it("leaves other themes on the site-setup favicon", () => {
    expect(bundledPublicInstallIcon("classic")).toBeNull();
    expect(bundledPublicInstallIcon("mimundo")).toBeNull();
    expect(bundledPublicInstallIcon(null)).toBeNull();
  });

  it("publishes the home mark as any, not maskable", () => {
    const icons = bundledPublicInstallManifestIcons(NAGO_BUNDLED_LOGO);
    expect(icons).toHaveLength(2);
    expect(icons.every((icon) => icon.src === NAGO_BUNDLED_LOGO)).toBe(true);
    expect(icons.every((icon) => icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(false);
  });

  it("replaces only the Apple touch icon", () => {
    const next = withAppleInstallIcon(
      { icon: "/favicon_io/favicon.ico", apple: "/favicon_io/apple-touch-icon.png" },
      NAGO_BUNDLED_LOGO,
    );
    expect(next).toMatchObject({
      icon: "/favicon_io/favicon.ico",
      apple: NAGO_BUNDLED_LOGO,
    });
  });
});
