import { describe, expect, it } from "vitest";
import {
  courseParentPayAllowed,
  courseSelfPayAllowed,
} from "@/lib/courses/courseBuyerEligibility";

const today = new Date("2026-10-28T12:00:00.000Z");

describe("courseSelfPayAllowed", () => {
  it("allows an adult student", () => {
    expect(
      courseSelfPayAllowed({
        role: "student",
        birthDate: "2000-01-01",
        legalAgeMajority: 18,
        today,
      }),
    ).toEqual({ ok: true });
  });

  it("blocks a minor student", () => {
    expect(
      courseSelfPayAllowed({
        role: "student",
        birthDate: "2015-06-01",
        legalAgeMajority: 18,
        today,
      }),
    ).toEqual({ ok: false, code: "minor" });
  });

  it("blocks a student with no birth date", () => {
    expect(
      courseSelfPayAllowed({
        role: "student",
        birthDate: null,
        legalAgeMajority: 18,
        today,
      }),
    ).toEqual({ ok: false, code: "missing_birth_date" });
  });

  it("blocks a parent from the self-pay path", () => {
    expect(
      courseSelfPayAllowed({
        role: "parent",
        birthDate: "1980-01-01",
        legalAgeMajority: 18,
        today,
      }),
    ).toEqual({ ok: false, code: "not_student" });
  });
});

describe("courseParentPayAllowed", () => {
  it("allows a parent and rejects a student", () => {
    expect(courseParentPayAllowed("parent")).toBe(true);
    expect(courseParentPayAllowed("student")).toBe(false);
  });
});
