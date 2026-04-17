import { describe, it, expect } from "vitest";
import { cyclePatAdmin, cyclePatTeacher } from "@/lib/academics/attendanceMatrixCellCycle";

describe("attendanceMatrixCellCycle", () => {
  it("cycles P/A/T for teacher mode", () => {
    expect(cyclePatTeacher(null)).toBe("present");
    expect(cyclePatTeacher("present")).toBe("absent");
    expect(cyclePatTeacher("absent")).toBe("late");
    expect(cyclePatTeacher("late")).toBe("present");
  });

  it("cycles P/A/T/E for admin mode", () => {
    expect(cyclePatAdmin(null)).toBe("present");
    expect(cyclePatAdmin("present")).toBe("absent");
    expect(cyclePatAdmin("absent")).toBe("late");
    expect(cyclePatAdmin("late")).toBe("excused");
    expect(cyclePatAdmin("excused")).toBe("present");
  });
});
