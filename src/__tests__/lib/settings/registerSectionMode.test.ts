// REGRESSION CHECK: An unknown register section mode must follow the old show-all boolean.
import { describe, expect, it } from "vitest";
import {
  isRegisterSectionMode,
  parseRegisterSectionMode,
} from "@/lib/settings/registerSectionMode";

describe("parseRegisterSectionMode", () => {
  it("keeps a valid stored mode", () => {
    expect(parseRegisterSectionMode("admin_assign", false)).toBe("admin_assign");
    expect(parseRegisterSectionMode("student_choice", false)).toBe("student_choice");
    expect(parseRegisterSectionMode("first_open", true)).toBe("first_open");
  });

  it("uses student choice when the old boolean is on and the new value is missing", () => {
    expect(parseRegisterSectionMode(undefined, true)).toBe("student_choice");
    expect(parseRegisterSectionMode(null, true)).toBe("student_choice");
  });

  it("uses the first open section when the old boolean is off or the value is unknown", () => {
    expect(parseRegisterSectionMode(undefined, false)).toBe("first_open");
    expect(parseRegisterSectionMode("yes", false)).toBe("first_open");
    expect(parseRegisterSectionMode({ mode: "admin_assign" }, true)).toBe("student_choice");
  });
});

describe("isRegisterSectionMode", () => {
  it("rejects values outside the three modes", () => {
    expect(isRegisterSectionMode("admin_assign")).toBe(true);
    expect(isRegisterSectionMode("nope")).toBe(false);
  });
});
