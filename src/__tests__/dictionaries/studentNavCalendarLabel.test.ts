/**
 * Subject: student portal "attendance" screen label (spec 6 of 8, F10 fix).
 *
 * The student nav item and breadcrumb for the /calendar route must read
 * "Asistencias" (es), "Attendance" (en), "Presenças" (pt) — matching the
 * family portal labels and the page content (attendance records).
 *
 * The family portal labels are also pinned here so a later edit cannot
 * accidentally change them.
 */
import { describe, it, expect } from "vitest";
import esDict from "@/dictionaries/es.json";
import enDict from "@/dictionaries/en.json";
import ptDict from "@/dictionaries/pt.json";

describe("Student nav calendar label — spec 6 F10 fix", () => {
  it("es: studentNav.calendar reads 'Asistencias'", () => {
    expect(esDict.dashboard.studentNav.calendar).toBe("Asistencias");
  });

  it("en: studentNav.calendar reads 'Attendance'", () => {
    expect(enDict.dashboard.studentNav.calendar).toBe("Attendance");
  });

  it("pt: studentNav.calendar reads 'Presenças'", () => {
    expect(ptDict.dashboard.studentNav.calendar).toBe("Presenças");
  });

  it("es: studentNav.breadcrumbCalendar matches the nav label", () => {
    expect(esDict.dashboard.studentNav.breadcrumbCalendar).toBe(
      esDict.dashboard.studentNav.calendar,
    );
  });

  it("en: studentNav.breadcrumbCalendar matches the nav label", () => {
    expect(enDict.dashboard.studentNav.breadcrumbCalendar).toBe(
      enDict.dashboard.studentNav.calendar,
    );
  });

  it("pt: studentNav.breadcrumbCalendar matches the nav label", () => {
    expect(ptDict.dashboard.studentNav.breadcrumbCalendar).toBe(
      ptDict.dashboard.studentNav.calendar,
    );
  });

  // Family portal labels must be unchanged (already correct)
  it("es: parentNav.calendar is still 'Asistencias'", () => {
    expect(esDict.dashboard.parentNav.calendar).toBe("Asistencias");
  });

  it("en: parentNav.calendar is still 'Attendance'", () => {
    expect(enDict.dashboard.parentNav.calendar).toBe("Attendance");
  });
});
