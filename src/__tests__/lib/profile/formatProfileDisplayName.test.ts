import { describe, expect, it } from "vitest";
import {
  compareProfileNamesByLastThenFirst,
  compareProfileSnakeByLastThenFirst,
  formatProfileNameSurnameFirst,
  formatProfileSnakeSurnameFirst,
} from "@/lib/profile/formatProfileDisplayName";

describe("formatProfileNameSurnameFirst", () => {
  it("orders last then first with a space", () => {
    expect(formatProfileNameSurnameFirst("María", "García López")).toBe("García López María");
  });

  it("uses fallback when both empty", () => {
    expect(formatProfileNameSurnameFirst("", "", "—")).toBe("—");
    expect(formatProfileNameSurnameFirst(null, null)).toBe("");
  });

  it("returns single non-empty part", () => {
    expect(formatProfileNameSurnameFirst("SoloNombre", "")).toBe("SoloNombre");
    expect(formatProfileNameSurnameFirst("", "SoloApellido")).toBe("SoloApellido");
  });
});

describe("formatProfileSnakeSurnameFirst", () => {
  it("maps snake_case fields", () => {
    expect(formatProfileSnakeSurnameFirst({ first_name: "A", last_name: "Z" })).toBe("Z A");
  });
});

describe("compareProfileNamesByLastThenFirst", () => {
  it("sorts by last name then first", () => {
    const rows = [
      { firstName: "Ana", lastName: "Zeta" },
      { firstName: "Luis", lastName: "Alpha" },
      { firstName: "Bea", lastName: "Alpha" },
    ];
    const sorted = [...rows].sort(compareProfileNamesByLastThenFirst);
    expect(sorted.map((r) => `${r.lastName} ${r.firstName}`)).toEqual([
      "Alpha Bea",
      "Alpha Luis",
      "Zeta Ana",
    ]);
  });
});

describe("compareProfileSnakeByLastThenFirst", () => {
  it("matches camelCase comparator", () => {
    expect(
      compareProfileSnakeByLastThenFirst(
        { first_name: "b", last_name: "a" },
        { first_name: "a", last_name: "a" },
      ),
    ).toBeGreaterThan(0);
  });
});
