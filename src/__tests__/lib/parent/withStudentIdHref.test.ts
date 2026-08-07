import { describe, it, expect } from "vitest";
import { withStudentIdHref } from "@/lib/parent/withStudentIdHref";

describe("withStudentIdHref", () => {
  it("returns href unchanged when studentId is null", () => {
    expect(withStudentIdHref("/en/dashboard/parent/progress", null)).toBe(
      "/en/dashboard/parent/progress",
    );
  });

  it("returns href unchanged when studentId is empty string", () => {
    expect(withStudentIdHref("/en/dashboard/parent/progress", "")).toBe(
      "/en/dashboard/parent/progress",
    );
  });

  it("appends ?studentId= to a bare href", () => {
    expect(withStudentIdHref("/en/dashboard/parent/progress", "s1")).toBe(
      "/en/dashboard/parent/progress?studentId=s1",
    );
  });

  it("appends &studentId= to an href with an existing query string", () => {
    expect(
      withStudentIdHref("/en/dashboard/parent/progress?tab=tasks", "s1"),
    ).toBe("/en/dashboard/parent/progress?tab=tasks&studentId=s1");
  });

  it("returns href unchanged when it already carries a studentId", () => {
    expect(
      withStudentIdHref("/en/dashboard/parent/progress?studentId=s1", "s2"),
    ).toBe("/en/dashboard/parent/progress?studentId=s1");
  });

  it("URL-encodes the studentId value", () => {
    const result = withStudentIdHref("/en/dashboard/parent/progress", "uuid with space");
    // URLSearchParams encodes spaces as + (also valid percent-encoding for query strings)
    expect(result).toMatch(/studentId=uuid[+%20]with[+%20]space/);
  });
});
