import { describe, expect, it } from "vitest";
import { parseRegistrationsPageTab } from "@/lib/register/parseRegistrationsPageTab";

describe("parseRegistrationsPageTab", () => {
  it("opens configuration when the URL says config", () => {
    expect(parseRegistrationsPageTab("config")).toBe("config");
  });

  it("opens the lead list when the value is missing or unknown", () => {
    expect(parseRegistrationsPageTab(undefined)).toBe("list");
    expect(parseRegistrationsPageTab(null)).toBe("list");
    expect(parseRegistrationsPageTab("")).toBe("list");
    expect(parseRegistrationsPageTab("settings")).toBe("list");
  });
});
