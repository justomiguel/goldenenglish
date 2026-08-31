import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(__dirname, "../../styles/nagoLanding.css"),
  "utf8",
);

function readNagoZTokens(source: string): Record<string, number> {
  const block = source.match(/\.nago-landing\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error("missing .nago-landing rule");
  const tokens: Record<string, number> = {};
  for (const match of block[1].matchAll(/--nago-z-([\w-]+)\s*:\s*(-?\d+)\s*;/g)) {
    tokens[match[1]] = Number(match[2]);
  }
  return tokens;
}

function ruleUsesZToken(source: string, selector: string, token: string): boolean {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `${escaped}\\s*\\{[^}]*z-index:\\s*var\\(--nago-z-${token}\\)`,
  ).test(source);
}

describe("nagoLanding.css", () => {
  it("stacks the header above grain and photos, under the lightbox", () => {
    const z = readNagoZTokens(css);
    expect(z.header).toBeGreaterThan(z.content);
    expect(z.header).toBeGreaterThan(z.grain);
    expect(z.scroll).toBeGreaterThan(z.content);
    expect(z.header).toBeGreaterThan(z.scroll);
    expect(z.lightbox).toBeGreaterThan(z.header);
    expect(ruleUsesZToken(css, ".nago-site-header", "header")).toBe(true);
    expect(ruleUsesZToken(css, ".nago-grain", "grain")).toBe(true);
    expect(ruleUsesZToken(css, ".nago-hero-bg", "content")).toBe(true);
    expect(ruleUsesZToken(css, ".nago-lightbox", "lightbox")).toBe(true);
    expect(ruleUsesZToken(css, ".nago-scroll-progress", "scroll")).toBe(true);
  });

  it("ties landing motion to scroll progress and drift", () => {
    expect(css).toMatch(/\.nago-scroll-drift[\s\S]*--nago-drift/);
    expect(css).toMatch(/nago-fade-in-left/);
    expect(css).toMatch(/nago-fade-in-right/);
  });

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

  it("places Ñuñoa schedules and fees side by side on wide viewports", () => {
    expect(css).toMatch(
      /\.nago-horario-board\s*\{[^}]*display:\s*grid/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1024px\)\s*\{\s*\.nago-horario-board\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.1fr\)\s+minmax\(20rem,\s*0\.9fr\)/,
    );
  });

  it("does not paint the Chile hero as a CSS background", () => {
    expect(css).not.toContain("/images/nago/inicio/hero-chile.png");
    expect(css).not.toContain("/images/nago/inicio/hero-bg.png");
  });

  it("masks reveals with the dramatic curve", () => {
    expect(css).toMatch(
      /\.nago-reveal-mask\.is-in \.nago-reveal-mask-inner[\s\S]*var\(--nago-ease-dramatic\)/,
    );
  });

  it("pins mestre under the header token", () => {
    expect(css).toMatch(
      /\.nago-mestre-pin\s*\{[^}]*top:\s*var\(--nago-header-h\)/,
    );
    expect(css).toMatch(
      /\.nago-mestre-pin\s*\{[^}]*z-index:\s*var\(--nago-z-content\)/,
    );
  });

  it("locks the cinematic three-curve palette", () => {
    expect(css).toMatch(/--nago-ease-dramatic\s*:\s*cubic-bezier\(0\.77,\s*0,\s*0\.175,\s*1\)/);
    expect(css).toMatch(/--nago-ease-snap\s*:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
    expect(css).toMatch(/--nago-ease\s*:\s*var\(--nago-ease-snap\)/);
    expect(css).toMatch(/--nago-ease-out\s*:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
    expect(css).toMatch(/--nago-spring-smooth\s*:\s*linear\(/);
  });

  it("lifts and presses nago buttons on fine pointers", () => {
    expect(css).toMatch(
      /@media \(hover:\s*hover\) and \(pointer:\s*fine\)[\s\S]*\.nago-btn:hover[\s\S]*translate3d\(0,\s*-2px,\s*0\)/,
    );
    expect(css).toMatch(/\.nago-btn:active[\s\S]*scale\(0\.97\)/);
  });
});
