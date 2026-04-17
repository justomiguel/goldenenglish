import { describe, expect, it } from "vitest";
import {
  TOKEN_GROUP_IDS,
  groupThemeTokens,
  normalizeTokenValueForPersistence,
  tokenFieldKindFromKey,
  tokenGroupFromKey,
} from "@/lib/cms/groupThemeTokens";

describe("tokenFieldKindFromKey", () => {
  it("returns 'color' for color keys", () => {
    expect(tokenFieldKindFromKey("color.primary")).toBe("color");
    expect(tokenFieldKindFromKey("color.calendarSpecial.holiday")).toBe(
      "color",
    );
  });
  it("returns 'shadow' for shadow keys", () => {
    expect(tokenFieldKindFromKey("shadow.soft")).toBe("shadow");
  });
  it("falls back to 'text' for layout / app / contact / social", () => {
    expect(tokenFieldKindFromKey("layout.max.width")).toBe("text");
    expect(tokenFieldKindFromKey("app.name")).toBe("text");
    expect(tokenFieldKindFromKey("contact.phone")).toBe("text");
    expect(tokenFieldKindFromKey("social.facebook")).toBe("text");
  });
});

describe("tokenGroupFromKey", () => {
  it("maps every allowed prefix to its group id", () => {
    expect(tokenGroupFromKey("color.primary")).toBe("color");
    expect(tokenGroupFromKey("layout.border.radius")).toBe("layout");
    expect(tokenGroupFromKey("shadow.card")).toBe("shadow");
    expect(tokenGroupFromKey("app.tagline")).toBe("app");
    expect(tokenGroupFromKey("contact.email")).toBe("contact");
    expect(tokenGroupFromKey("social.instagram")).toBe("social");
  });
  it("returns null for non-visual keys outside the allow-list", () => {
    expect(tokenGroupFromKey("legal.age.majority")).toBeNull();
    expect(tokenGroupFromKey("analytics.timezone")).toBeNull();
    expect(tokenGroupFromKey("billing.term.monthly")).toBeNull();
  });
});

describe("groupThemeTokens", () => {
  const defaults = {
    "color.primary": "#103A5C",
    "color.secondary": "#A31A22",
    "shadow.soft": "0 4px 24px -4px rgb(16 58 92 / 12%)",
    "layout.max.width": "1280px",
    "app.name": "Golden English",
    "legal.age.majority": "18",
    "analytics.timezone": "America/Argentina/Cordoba",
  };

  it("returns groups in canonical order and skips empty groups", () => {
    const groups = groupThemeTokens(defaults, {});
    expect(groups.map((g) => g.id)).toEqual([
      "color",
      "layout",
      "shadow",
      "app",
    ]);
  });

  it("excludes keys outside the override allow-list", () => {
    const groups = groupThemeTokens(defaults, {});
    const allKeys = groups.flatMap((g) => g.tokens.map((t) => t.key));
    expect(allKeys).not.toContain("legal.age.majority");
    expect(allKeys).not.toContain("analytics.timezone");
  });

  it("marks overrides that diverge from the default", () => {
    const groups = groupThemeTokens(defaults, {
      "color.primary": "#000000",
      "app.name": "Golden English",
    });
    const colorGroup = groups.find((g) => g.id === "color")!;
    const primary = colorGroup.tokens.find((t) => t.key === "color.primary")!;
    expect(primary.value).toBe("#000000");
    expect(primary.defaultValue).toBe("#103A5C");
    expect(primary.isOverridden).toBe(true);

    const appGroup = groups.find((g) => g.id === "app")!;
    const appName = appGroup.tokens.find((t) => t.key === "app.name")!;
    // Override matches default → not flagged as "overridden".
    expect(appName.isOverridden).toBe(false);
  });

  it("ignores empty / whitespace-only override values", () => {
    const groups = groupThemeTokens(defaults, {
      "color.primary": "   ",
    });
    const primary = groups
      .find((g) => g.id === "color")!
      .tokens.find((t) => t.key === "color.primary")!;
    expect(primary.value).toBe("#103A5C");
    expect(primary.isOverridden).toBe(false);
  });

  it("sorts tokens within a group alphabetically by key", () => {
    const groups = groupThemeTokens(defaults, {});
    const colorKeys = groups
      .find((g) => g.id === "color")!
      .tokens.map((t) => t.key);
    expect(colorKeys).toEqual([...colorKeys].sort());
  });

  it("supports null overrides", () => {
    const groups = groupThemeTokens(defaults, null);
    expect(groups.length).toBeGreaterThan(0);
  });
});

describe("normalizeTokenValueForPersistence", () => {
  it("returns 'noop' for keys outside the editable surface", () => {
    expect(
      normalizeTokenValueForPersistence("legal.age.majority", "21", "18"),
    ).toEqual({ action: "noop" });
  });
  it("clears the override when the value is empty", () => {
    expect(
      normalizeTokenValueForPersistence("color.primary", "   ", "#000"),
    ).toEqual({ action: "clear" });
  });
  it("clears the override when the value matches the default", () => {
    expect(
      normalizeTokenValueForPersistence("color.primary", "#000", "#000"),
    ).toEqual({ action: "clear" });
  });
  it("persists trimmed values that diverge from the default", () => {
    expect(
      normalizeTokenValueForPersistence("color.primary", "  #fff  ", "#000"),
    ).toEqual({ action: "set", value: "#fff" });
  });
});

describe("TOKEN_GROUP_IDS", () => {
  it("only contains ids that are also override prefixes", () => {
    for (const id of TOKEN_GROUP_IDS) {
      expect(tokenGroupFromKey(`${id}.example`)).toBe(id);
    }
  });
});
