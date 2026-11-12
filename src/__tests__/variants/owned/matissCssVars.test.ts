import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(__dirname, "../../../variants/owned/matiss/styles/landing.css"),
  "utf8",
);

describe("matiss landing css variables", () => {
  it("keeps the painted colors on ds and private names", () => {
    expect(css).toContain("--ds-color-background: #fcf4f7;");
    expect(css).toContain("--ds-color-primary: #6b4c9e;");
    expect(css).toContain("--ds-color-foreground: #3a2a52;");
    expect(css).toContain("--owned-line: #d8c0e4;");
    expect(css).toContain("--color-border: var(--owned-line);");
    expect(css).not.toContain("--matiss-");
  });
});
