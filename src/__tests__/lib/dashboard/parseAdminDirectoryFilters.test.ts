import { describe, expect, it } from "vitest";
import { parseAdminDirectoryFilters } from "@/lib/dashboard/adminDirectoryFilters";

describe("parseAdminDirectoryFilters", () => {
  it("keeps student keys and drops teacher-only or invalid values", () => {
    expect(
      parseAdminDirectoryFilters("student", {
        section: "sec-1",
        access: "never",
        phone: "without",
        created: "last30",
        enrollment: "with",
        parentLink: "without",
        scholarship: "with",
        due: "without",
        teachingRole: "lead",
        email: "none",
        children: "with",
        bogus: "x",
      }),
    ).toEqual({
      section: "sec-1",
      access: "never",
      phone: "without",
      created: "last30",
      enrollment: "with",
      parentLink: "without",
      scholarship: "with",
      due: "without",
    });
  });

  it("keeps teacher and parent keys for those roles", () => {
    expect(
      parseAdminDirectoryFilters("teacher", {
        section: "  ",
        access: "all",
        enrollment: "maybe",
        teachingRole: "assistant",
      }),
    ).toEqual({ teachingRole: "assistant" });

    expect(
      parseAdminDirectoryFilters("parent", {
        email: "deliverable",
        children: "without",
        access: "entered",
        due: "with",
      }),
    ).toEqual({
      email: "deliverable",
      children: "without",
      access: "entered",
    });
  });
});
