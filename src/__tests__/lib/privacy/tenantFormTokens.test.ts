/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function css(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf-8");
}

describe("landing roots remap --color-* so shared forms inherit tenant chrome", () => {
  it("Liora landing maps surface to cream-deep and primary to rose-deep", () => {
    const src = css("src/styles/lioraLanding.css");
    expect(src).toMatch(/\.liora-landing[\s\S]*--color-surface:\s*var\(--liora-cream-deep\)/);
    expect(src).toMatch(/\.liora-landing[\s\S]*--color-primary:\s*var\(--liora-rose-deep\)/);
    expect(src).toMatch(/\.liora-card[\s\S]*background:\s*var\(--color-surface\)/);
  });

  it("Espacio Zenit landing maps surface to the dark sheet, not site-theme white", () => {
    const src = css("src/styles/espaciozenitLanding.css");
    expect(src).toMatch(/\.ez-landing\.mz-landing[\s\S]*--color-surface:\s*#070b12/);
    expect(src).toMatch(/\.ez-landing\.mz-landing[\s\S]*--color-primary:\s*var\(--ez-cyan-soft\)/);
    expect(src).toMatch(/html:has\(\.ez-landing\)[\s\S]*--color-surface:\s*#070b12/);
  });

  it("Mi Mundo landing maps primary to green-dark, not yellow", () => {
    const src = css("src/styles/mimundoLanding.css");
    expect(src).toMatch(/\.mimundo-landing[\s\S]*--color-primary:\s*var\(--mm-green-dark\)/);
    expect(src).toMatch(/\.mimundo-landing[\s\S]*--color-surface:\s*var\(--mm-paper\)/);
  });

  it("Mozarthitos landing maps primary to deep red on a warm sheet", () => {
    const src = css("src/styles/mozarthitosLanding.css");
    expect(src).toMatch(
      /\.mz-landing:not\(\.ez-landing\)[\s\S]*--color-primary:\s*var\(--mz-header-red-deep\)/,
    );
  });
});
