import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(__dirname, "../../styles/nagoLanding.css"),
  "utf8",
);

describe("nagoLanding.css", () => {
  it("smooth-scrolls hash anchors on the nago public surface", () => {
    expect(css).toMatch(/html:has\(\.nago-landing\)[\s\S]*scroll-behavior:\s*smooth/);
  });

  it("defines a very fine film grain overlay", () => {
    expect(css).toMatch(/\.nago-grain/);
    expect(css).toMatch(/pointer-events:\s*none/);
  });

  it("does not paint the Chile hero as a CSS background", () => {
    expect(css).not.toContain("/images/nago/inicio/hero-chile.png");
    expect(css).not.toContain("/images/nago/inicio/hero-bg.png");
  });
});
