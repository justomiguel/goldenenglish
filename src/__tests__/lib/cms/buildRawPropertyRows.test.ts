import { describe, expect, it } from "vitest";
import {
  buildInitialRawDraft,
  buildRawPropertyRows,
  isAllowedOverrideKey,
} from "@/lib/cms/buildRawPropertyRows";

describe("isAllowedOverrideKey", () => {
  it("accepts keys under the allow-listed prefixes", () => {
    expect(isAllowedOverrideKey("color.primary")).toBe(true);
    expect(isAllowedOverrideKey("layout.max-width")).toBe(true);
    expect(isAllowedOverrideKey("shadow.card")).toBe(true);
    expect(isAllowedOverrideKey("app.name")).toBe(true);
    expect(isAllowedOverrideKey("contact.email")).toBe(true);
    expect(isAllowedOverrideKey("social.tiktok")).toBe(true);
  });

  it("rejects keys outside the allow-list", () => {
    expect(isAllowedOverrideKey("")).toBe(false);
    expect(isAllowedOverrideKey("legal.age.majority")).toBe(false);
    expect(isAllowedOverrideKey("analytics.timezone")).toBe(false);
    expect(isAllowedOverrideKey("random")).toBe(false);
  });
});

describe("buildRawPropertyRows", () => {
  const defaults = {
    "color.primary": "#111111",
    "color.secondary": "#222222",
    "app.name": "Golden English",
    "legal.age.majority": "18",
  } as const;

  it("renders every allow-listed default, even without override", () => {
    const rows = buildRawPropertyRows(defaults, {});
    const keys = rows.map((r) => r.key);
    expect(keys).toEqual(["app.name", "color.primary", "color.secondary"]);
    for (const row of rows) {
      expect(row.overrideValue).toBeNull();
      expect(row.isOverridden).toBe(false);
    }
  });

  it("marks rows as overridden only when they differ from the default", () => {
    const rows = buildRawPropertyRows(defaults, {
      "color.primary": "#111111",
      "color.secondary": "#ff0000",
    });
    const primary = rows.find((r) => r.key === "color.primary")!;
    const secondary = rows.find((r) => r.key === "color.secondary")!;
    expect(primary.isOverridden).toBe(false);
    expect(secondary.isOverridden).toBe(true);
    expect(secondary.overrideValue).toBe("#ff0000");
  });

  it("includes keys that only exist as overrides (not in defaults)", () => {
    const rows = buildRawPropertyRows(defaults, {
      "social.tiktok": "https://tiktok.com/@ge",
    });
    const tiktok = rows.find((r) => r.key === "social.tiktok");
    expect(tiktok).toBeDefined();
    expect(tiktok!.defaultValue).toBeNull();
    expect(tiktok!.isOverridden).toBe(true);
  });

  it("ignores keys outside the allow-list in both defaults and overrides", () => {
    const rows = buildRawPropertyRows(defaults, {
      "legal.age.majority": "21",
      "random.key": "foo",
    });
    const keys = rows.map((r) => r.key);
    expect(keys).not.toContain("legal.age.majority");
    expect(keys).not.toContain("random.key");
  });

  it("tolerates empty-string override values by treating them as absent", () => {
    const rows = buildRawPropertyRows(defaults, {
      "color.primary": "   ",
    });
    const primary = rows.find((r) => r.key === "color.primary")!;
    expect(primary.overrideValue).toBeNull();
    expect(primary.isOverridden).toBe(false);
  });
});

describe("buildInitialRawDraft", () => {
  it("returns only the keys with an active override, verbatim", () => {
    const rows = buildRawPropertyRows(
      {
        "color.primary": "#111",
        "color.secondary": "#222",
      },
      { "color.primary": "#abc" },
    );
    expect(buildInitialRawDraft(rows)).toEqual({ "color.primary": "#abc" });
  });
});
