import { describe, expect, it } from "vitest";
import {
  INSTITUTE_TIMEZONE_DEFAULT,
  parseInstituteTimeZone,
} from "@/lib/datetime/parseInstituteTimeZone";

describe("parseInstituteTimeZone", () => {
  it("returns the canonical default when the row is missing", () => {
    expect(parseInstituteTimeZone(null)).toBe(INSTITUTE_TIMEZONE_DEFAULT);
    expect(parseInstituteTimeZone(undefined)).toBe(INSTITUTE_TIMEZONE_DEFAULT);
  });

  it("returns the canonical default when timezone key is missing", () => {
    expect(parseInstituteTimeZone({})).toBe(INSTITUTE_TIMEZONE_DEFAULT);
    expect(parseInstituteTimeZone({ timezone: "" })).toBe(
      INSTITUTE_TIMEZONE_DEFAULT,
    );
  });

  it("trims surrounding whitespace from valid values", () => {
    expect(parseInstituteTimeZone({ timezone: "  Europe/Madrid  " })).toBe(
      "Europe/Madrid",
    );
  });

  it("honors caller-provided defaults", () => {
    expect(parseInstituteTimeZone(null, "UTC")).toBe("UTC");
  });
});
