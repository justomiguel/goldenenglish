/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  registerPickerSectionTone,
  registerPickerSectionToneIndex,
  registerPickerSectionToneStyle,
} from "@/lib/register/registerPickerSectionTone";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";
const D = "44444444-4444-4444-8444-444444444444";
const E = "55555555-5555-4555-8555-555555555555";
const F = "66666666-6666-4666-8666-666666666666";

function hueDelta(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return Math.min(raw, 360 - raw);
}

describe("registerPickerSectionToneIndex", () => {
  it("is stable for the same section id in the same set", () => {
    expect(registerPickerSectionToneIndex(A, [A, B])).toBe(
      registerPickerSectionToneIndex(A, [B, A]),
    );
  });

  it("gives different tones to different section ids", () => {
    expect(registerPickerSectionToneIndex(A, [A, B])).not.toBe(
      registerPickerSectionToneIndex(B, [A, B]),
    );
  });
});

describe("registerPickerSectionTone", () => {
  it("spaces sequential section hues far enough to tell them apart", () => {
    const ids = [A, B, C, D, E, F];
    const hues = ids.map((id) => registerPickerSectionTone(id, ids).h);
    for (let i = 1; i < hues.length; i++) {
      expect(hueDelta(hues[i - 1]!, hues[i]!)).toBeGreaterThanOrEqual(80);
    }
  });
});

describe("registerPickerSectionToneStyle", () => {
  it("returns the same ink color for a section in soft and strong intensity", () => {
    const soft = registerPickerSectionToneStyle(A, "soft", [A, B]);
    const strong = registerPickerSectionToneStyle(A, "strong", [A, B]);
    expect(soft.color).toBe(strong.color);
    expect(soft.borderColor).toBe(strong.borderColor);
    expect(strong.backgroundColor).not.toBe(soft.backgroundColor);
  });
});
