import { describe, it, expect } from "vitest";
import { groupParentRecentAttendance } from "@/lib/parent/groupParentRecentAttendance";
import type { ParentAttendanceMark } from "@/lib/parent/loadParentRecentAttendance";

const marks: ParentAttendanceMark[] = [
  {
    markId: "1",
    attendedOn: "2026-05-10",
    status: "present",
    studentId: "s1",
    studentName: "Ana Beta",
    sectionId: "sec-a",
    sectionName: "Kids A",
  },
  {
    markId: "2",
    attendedOn: "2026-05-08",
    status: "absent",
    studentId: "s1",
    studentName: "Ana Beta",
    sectionId: "sec-a",
    sectionName: "Kids A",
  },
  {
    markId: "3",
    attendedOn: "2026-05-09",
    status: "absent",
    studentId: "s2",
    studentName: "Bruno Alpha",
    sectionId: "sec-b",
    sectionName: "Teens B",
  },
];

describe("groupParentRecentAttendance", () => {
  it("groups marks by child and section, newest first within section", () => {
    const groups = groupParentRecentAttendance(marks, null);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.studentName).toBe("Ana Beta");
    expect(groups[0]?.sections[0]?.marks[0]?.attendedOn).toBe("2026-05-10");
    expect(groups[1]?.studentName).toBe("Bruno Alpha");
    expect(groups[1]?.sections[0]?.marks[0]?.attendedOn).toBe("2026-05-09");
  });

  it("filters to one child when requested", () => {
    const groups = groupParentRecentAttendance(marks, "s1");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.studentId).toBe("s1");
  });
});
