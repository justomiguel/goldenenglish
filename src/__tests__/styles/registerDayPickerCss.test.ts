import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../../app/globals.css"), "utf8");

describe("register birth-date day picker CSS", () => {
  it("keeps the calendar compact instead of stretching with the form", () => {
    expect(css).toMatch(
      /\.register-day-picker-scope \.rdp-root\s*\{[^}]*max-width:\s*16\.5rem/,
    );
    expect(css).toMatch(
      /\.register-day-picker-scope \.rdp-root\s*\{[^}]*--rdp-day_button-width:\s*1\.875rem/,
    );
    expect(css).toMatch(
      /\.register-day-picker-scope \.rdp-month_grid\s*\{[^}]*width:\s*max-content/,
    );
  });
});
