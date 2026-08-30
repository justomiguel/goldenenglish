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

  it("keeps public bands and program cards on the dark graphite palette", () => {
    expect(css).not.toMatch(/\.nago-band-light\s*\{\s*background:\s*#f6f3ec/);
    expect(css).not.toMatch(/\.nago-band-sand\s*\{\s*background:\s*#ebe6dc/);
    expect(css).not.toMatch(/\.nago-program-card\s*\{[^}]*background:\s*#fff/);
    expect(css).toMatch(/\.nago-landing[\s\S]*color-scheme:\s*dark/);
  });

  it("does not paint the Chile hero as a CSS background", () => {
    expect(css).not.toContain("/images/nago/inicio/hero-chile.png");
    expect(css).not.toContain("/images/nago/inicio/hero-bg.png");
  });
});
