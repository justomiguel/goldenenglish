import { describe, expect, it } from "vitest";
import { matissGroupsForAge } from "@/lib/landing/matissSchedule";

describe("matissGroupsForAge", () => {
  it("returns no group below 3 or above 13", () => {
    expect(matissGroupsForAge(2)).toEqual([]);
    expect(matissGroupsForAge(14)).toEqual([]);
    expect(matissGroupsForAge(4.5)).toEqual([]);
  });

  it("offers only San Miguel Babys at age 3", () => {
    const groups = matissGroupsForAge(3);
    expect(groups.map((group) => group.id)).toEqual(["babys-san-miguel"]);
    expect(groups[0]).toMatchObject({ start: "12:30", end: "13:30", day: "saturday" });
  });

  it("offers both Babys groups at age 5", () => {
    expect(matissGroupsForAge(5).map((group) => group.id)).toEqual([
      "babys-san-miguel",
      "babys-la-florida",
    ]);
  });

  it("runs La Florida Babys from 19:00 to 20:00, as the studio schedule says", () => {
    const laFlorida = matissGroupsForAge(5).find((group) => group.id === "babys-la-florida");
    expect(laFlorida).toMatchObject({ start: "19:00", end: "20:00", day: "saturday" });
  });

  it("offers San Miguel Senior and La Florida Babys at age 7", () => {
    expect(matissGroupsForAge(7).map((group) => group.location)).toEqual([
      "sanMiguel",
      "laFlorida",
    ]);
  });

  it("offers only San Miguel Senior at age 13", () => {
    const groups = matissGroupsForAge(13);
    expect(groups.map((group) => group.id)).toEqual(["senior-san-miguel"]);
    expect(groups[0]).toMatchObject({ start: "13:30", end: "15:00" });
  });
});
