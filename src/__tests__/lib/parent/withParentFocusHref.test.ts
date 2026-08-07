import { describe, expect, it } from "vitest";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

describe("withParentFocusHref", () => {
  it("returns href unchanged when both ids are null", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent/progress", {
        studentId: null,
        sectionId: null,
      }),
    ).toBe("/en/dashboard/parent/progress");
  });

  it("appends both params to a bare href", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent/progress", {
        studentId: "s1",
        sectionId: "sec-a",
      }),
    ).toBe("/en/dashboard/parent/progress?studentId=s1&sectionId=sec-a");
  });

  it("preserves existing tab param", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent/progress?tab=tasks", {
        studentId: "s1",
        sectionId: "sec-a",
      }),
    ).toBe("/en/dashboard/parent/progress?tab=tasks&studentId=s1&sectionId=sec-a");
  });

  it("does not overwrite an existing studentId", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent/progress?studentId=s1", {
        studentId: "s2",
        sectionId: "sec-a",
      }),
    ).toBe("/en/dashboard/parent/progress?studentId=s1&sectionId=sec-a");
  });

  it("does not overwrite an existing sectionId", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent/progress?sectionId=sec-a", {
        studentId: "s1",
        sectionId: "sec-b",
      }),
    ).toBe("/en/dashboard/parent/progress?sectionId=sec-a&studentId=s1");
  });

  it("sets only studentId when sectionId is null", () => {
    expect(
      withParentFocusHref("/en/dashboard/parent", {
        studentId: "s1",
        sectionId: null,
      }),
    ).toBe("/en/dashboard/parent?studentId=s1");
  });
});
