import { describe, it, expect } from "vitest";
import {
  getProperty,
  loadProperties,
  parseProperties,
  toCssString,
  toCssVariables,
} from "@/lib/theme/themeParser";

describe("parseProperties", () => {
  it("ignores comments and blank lines", () => {
    const raw = `
# comment
app.name=Golden

color.primary=#fff
`;
    expect(parseProperties(raw)).toEqual({
      "app.name": "Golden",
      "color.primary": "#fff",
    });
  });

  it("trims keys and values", () => {
    expect(parseProperties("  k  =  v  ")).toEqual({ k: "v" });
  });

  it("ignores lines without equals", () => {
    expect(parseProperties("not_a_pair")).toEqual({});
  });
});

describe("getProperty", () => {
  it("returns fallback when missing", () => {
    expect(getProperty({}, "x", "d")).toBe("d");
  });
});

describe("toCssVariables", () => {
  it("maps dot keys to --kebab segments", () => {
    expect(toCssVariables({ "app.name": "X" })).toEqual({
      "--app-name": "X",
    });
  });
});

describe("toCssString", () => {
  it("joins declarations", () => {
    const s = toCssString({ a: "1" });
    expect(s).toContain("--a: 1;");
  });
});

describe("loadProperties", () => {
  it("reads system.properties from cwd", () => {
    const p = loadProperties();
    expect(p["app.name"].length).toBeGreaterThan(0);
  });
});
