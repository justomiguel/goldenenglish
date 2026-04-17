import { describe, it, expect } from "vitest";
import {
  cssRootBlock,
  cssVariablesBlock,
  mergeProperties,
  sanitizeCssValue,
} from "@/lib/theme/themeOverrides";

// REGRESSION CHECK: Changing the merge / CSS contract may silently break the
// runtime <style> block in src/app/layout.tsx and the brand layer.
// Invariants to preserve:
//   1. Only allowed prefixes (color/layout/shadow/app/contact/social) override.
//   2. CSS emission only includes color/layout/shadow keys (app.* etc. drive
//      the brand object, not the stylesheet).
//   3. Sanitizer rejects any value containing `<`, `>`, `{`, `}`, `;`, or
//      newlines so the inline <style> can never be broken out of.

describe("mergeProperties", () => {
  const base = {
    "color.primary": "#103A5C",
    "layout.max.width": "1280px",
    "legal.age.majority": "18",
  };

  it("returns a copy of defaults when no overrides", () => {
    const out = mergeProperties(base, null);
    expect(out).toEqual(base);
    expect(out).not.toBe(base);
  });

  it("applies overrides for whitelisted prefixes", () => {
    const out = mergeProperties(base, {
      "color.primary": "#000000",
      "shadow.soft": "0 1px 2px rgb(0 0 0 / 10%)",
      "app.tagline": "Nueva temporada",
      "contact.email": "info@example.com",
      "social.instagram": "https://instagram.com/x",
    });
    expect(out["color.primary"]).toBe("#000000");
    expect(out["shadow.soft"]).toBe("0 1px 2px rgb(0 0 0 / 10%)");
    expect(out["app.tagline"]).toBe("Nueva temporada");
    expect(out["contact.email"]).toBe("info@example.com");
    expect(out["social.instagram"]).toBe("https://instagram.com/x");
  });

  it("ignores overrides for keys outside the whitelist", () => {
    const out = mergeProperties(base, {
      "legal.age.majority": "21",
      "academics.section.max_students": "999",
    });
    expect(out["legal.age.majority"]).toBe("18");
    expect(out["academics.section.max_students"]).toBeUndefined();
  });

  it("ignores empty / non-string values", () => {
    const out = mergeProperties(base, {
      "color.primary": "   ",
      "color.secondary": "#A31A22",
      // @ts-expect-error — runtime guard against bad JSONB
      "color.accent": 42,
    });
    expect(out["color.primary"]).toBe("#103A5C");
    expect(out["color.secondary"]).toBe("#A31A22");
    expect(out["color.accent"]).toBeUndefined();
  });
});

describe("sanitizeCssValue", () => {
  it("trims and accepts safe values", () => {
    expect(sanitizeCssValue("  #103A5C  ")).toBe("#103A5C");
    expect(sanitizeCssValue("0 4px 24px -4px rgb(16 58 92 / 12%)")).toBe(
      "0 4px 24px -4px rgb(16 58 92 / 12%)",
    );
  });

  it("rejects values with markup or extra declarations", () => {
    expect(sanitizeCssValue("red; } body { color: blue")).toBeNull();
    expect(sanitizeCssValue("</style><script>")).toBeNull();
    expect(sanitizeCssValue("rgb(0 0 0)\nmore: stuff")).toBeNull();
    expect(sanitizeCssValue("")).toBeNull();
  });
});

describe("cssVariablesBlock / cssRootBlock", () => {
  it("emits only color/layout/shadow keys, sorted alphabetically", () => {
    const block = cssVariablesBlock({
      "color.primary": "#103A5C",
      "color.background": "#FAF9F6",
      "layout.max.width": "1280px",
      "shadow.soft": "0 1px 2px rgb(0 0 0 / 10%)",
      "app.name": "Golden English",
      "contact.email": "x@x.com",
      "legal.age.majority": "18",
    });
    expect(block).toBe(
      [
        "  --color-background: #FAF9F6;",
        "  --color-primary: #103A5C;",
        "  --layout-max-width: 1280px;",
        "  --shadow-soft: 0 1px 2px rgb(0 0 0 / 10%);",
      ].join("\n"),
    );
  });

  it("skips keys whose value is unsafe", () => {
    const block = cssVariablesBlock({
      "color.primary": "</style><script>alert(1)</script>",
      "color.secondary": "#A31A22",
    });
    expect(block).toBe("  --color-secondary: #A31A22;");
  });

  it("wraps the body in a :root block, even when empty", () => {
    expect(cssRootBlock({})).toBe(":root {}");
    expect(cssRootBlock({ "color.primary": "#000" })).toBe(
      ":root {\n  --color-primary: #000;\n}",
    );
  });
});
