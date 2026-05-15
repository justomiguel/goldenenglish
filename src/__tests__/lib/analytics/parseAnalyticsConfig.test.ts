import { describe, expect, it } from "vitest";
import {
  ANALYTICS_CONFIG_DEFAULTS,
  parseAnalyticsConfig,
} from "@/lib/analytics/parseAnalyticsConfig";

describe("parseAnalyticsConfig", () => {
  it("returns canonical defaults when the row is missing", () => {
    expect(parseAnalyticsConfig(null)).toEqual(ANALYTICS_CONFIG_DEFAULTS);
    expect(parseAnalyticsConfig(undefined)).toEqual(ANALYTICS_CONFIG_DEFAULTS);
  });

  it("returns canonical defaults when the shape is wrong", () => {
    expect(parseAnalyticsConfig("garbage")).toEqual(ANALYTICS_CONFIG_DEFAULTS);
  });

  it("merges partial overrides over defaults", () => {
    const parsed = parseAnalyticsConfig({ namespace: "tenant_xyz" });
    expect(parsed.namespace).toBe("tenant_xyz");
    expect(parsed.version).toBe(ANALYTICS_CONFIG_DEFAULTS.version);
    expect(parsed.timezone).toBe(ANALYTICS_CONFIG_DEFAULTS.timezone);
  });

  it("ignores empty strings", () => {
    const parsed = parseAnalyticsConfig({
      namespace: "  ",
      version: "",
      timezone: "Europe/Paris",
    });
    expect(parsed.namespace).toBe(ANALYTICS_CONFIG_DEFAULTS.namespace);
    expect(parsed.version).toBe(ANALYTICS_CONFIG_DEFAULTS.version);
    expect(parsed.timezone).toBe("Europe/Paris");
  });
});
