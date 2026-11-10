import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../../styles/lioraLanding.css"), "utf8");

function token(name: string): string {
  const match = css.match(new RegExp(`--liora-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`missing token --liora-${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("Liora palette", () => {
  it("uses the Instagram paper and rose", () => {
    expect(token("cream").toLowerCase()).toBe("#fcf2f1");
    expect(token("rose").toLowerCase()).toBe("#e48a94");
  });

  it("keeps display titles at 3:1 on paper", () => {
    expect(contrast(token("rose-title"), token("cream"))).toBeGreaterThanOrEqual(3);
  });

  it("keeps body rose text, ink, and soft ink at 4.5:1 on paper and blush", () => {
    for (const fg of ["rose-text", "ink", "ink-soft"]) {
      expect(contrast(token(fg), token("cream")), fg).toBeGreaterThanOrEqual(4.5);
      expect(contrast(token(fg), token("blush")), fg).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps white labels at 4.5:1 on filled buttons and their hover", () => {
    expect(contrast("#ffffff", token("rose-deep"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#ffffff", token("rose-text"))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps paper text at 4.5:1 on the footer", () => {
    expect(contrast(token("cream"), token("footer"))).toBeGreaterThanOrEqual(4.5);
  });
});
