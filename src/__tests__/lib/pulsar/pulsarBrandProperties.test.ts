// REGRESSION CHECK: CentroListo platform requests must receive the warm organic paper-and-sage
// semantic brand palette (#FAF8F5 paper, #2D5A47 serene forest sage, #C87D55 warm terracotta,
// #1C2420 deep forest ink) without mutating SYSTEM_PROPERTIES_DEFAULTS for tenant institutes.
import { describe, expect, it } from "vitest";
import { loadPulsarPlatformProperties } from "@/lib/pulsar/pulsarBrandProperties";
import { loadProperties } from "@/lib/theme/themeParser";

describe("loadPulsarPlatformProperties", () => {
  it("returns CentroListo warm paper-and-sage brand tokens without mutating defaults", () => {
    const baseline = loadProperties();
    const props = loadPulsarPlatformProperties();

    expect(props["app.name"]).toBe("CentroListo");
    expect(props["color.primary"]).toBe("#2D5A47");
    expect(props["color.primary.dark"]).toBe("#1F4233");
    expect(props["color.primary.light"]).toBe("#3E755E");
    expect(props["color.primary.foreground"]).toBe("#FFFFFF");
    expect(props["color.secondary"]).toBe("#1C2420");
    expect(props["color.secondary.foreground"]).toBe("#FAF8F5");
    expect(props["color.accent"]).toBe("#C87D55");
    expect(props["color.background"]).toBe("#FAF8F5");
    expect(props["color.surface"]).toBe("#FFFFFF");
    expect(props["color.foreground"]).toBe("#1C2420");
    expect(props["color.muted"]).toBe("#F2EFE9");
    expect(props["color.muted.foreground"]).toBe("#525E57");
    expect(props["color.border"]).toBe("#E4E0D8");

    expect(props["app.favicon.path"]).toBe("/centrolisto/favicon.ico");
    expect(props["app.logo.path"]).toBe("/centrolisto/android-chrome-512x512.png");

    expect(loadProperties()["app.name"]).toBe(baseline["app.name"]);
    expect(loadProperties()["color.primary"]).toBe(baseline["color.primary"]);
  });
});
