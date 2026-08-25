import { describe, expect, it } from "vitest";
import { peopleSharePercent } from "@/lib/dashboard/loadAdminPeoplePageStats";

describe("peopleSharePercent", () => {
  it("returns one decimal like the people mockup", () => {
    expect(peopleSharePercent(94, 128)).toBe(73.4);
    expect(peopleSharePercent(0, 10)).toBe(0);
    expect(peopleSharePercent(5, 0)).toBe(0);
  });
});
