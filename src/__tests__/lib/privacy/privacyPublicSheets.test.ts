/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function css(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf-8");
}

describe("privacy public sheets remap --color-* onto landing tokens", () => {
  it("Nago landing remaps primary to gold and heading to cream", () => {
    const src = css("src/styles/nagoLanding.css");
    expect(src).toMatch(/\.nago-landing[\s\S]*--color-primary:\s*var\(--nago-gold\)/);
    expect(src).toMatch(/\.nago-landing[\s\S]*--color-heading:\s*var\(--nago-heading-solid\)/);
    expect(src).toMatch(/\.nago-landing[\s\S]*--color-foreground:\s*var\(--nago-ink\)/);
  });

  it("Liora sheet uses rose-deep so text stays AA on cream", () => {
    const src = css("src/styles/lioraLanding.css");
    expect(src).toMatch(
      /\.liora-public-sheet[\s\S]*--color-primary:\s*var\(--liora-rose-deep\)/,
    );
    expect(src).toMatch(/\.liora-public-sheet[\s\S]*--color-foreground:\s*var\(--liora-ink\)/);
  });

  it("Espacio Zenit sheet uses cyan-soft and white on black", () => {
    const src = css("src/styles/espaciozenitLanding.css");
    expect(src).toMatch(/\.ez-public-sheet[\s\S]*--color-primary:\s*var\(--ez-cyan-soft\)/);
    expect(src).toMatch(/\.ez-public-sheet[\s\S]*--color-heading:\s*#ffffff/);
  });

  it("Mi Mundo sheet uses green-dark and ink, not yellow or pink text", () => {
    const src = css("src/styles/mimundoLanding.css");
    expect(src).toMatch(/\.mimundo-public-sheet[\s\S]*--color-primary:\s*var\(--mm-green-dark\)/);
    expect(src).toMatch(/\.mimundo-public-sheet[\s\S]*--color-foreground:\s*var\(--mm-ink-deep\)/);
    expect(src).not.toMatch(/\.mimundo-public-sheet[\s\S]*--color-primary:\s*var\(--mm-yellow\)/);
  });

  it("Mozarthitos sheet uses deep red and ink on white", () => {
    const src = css("src/styles/mozarthitosLanding.css");
    expect(src).toMatch(
      /\.mz-public-sheet[\s\S]*--color-primary:\s*var\(--mz-header-red-deep\)/,
    );
    expect(src).toMatch(/\.mz-public-sheet[\s\S]*--color-muted-foreground:\s*var\(--mz-ink-on-white\)/);
  });
});
