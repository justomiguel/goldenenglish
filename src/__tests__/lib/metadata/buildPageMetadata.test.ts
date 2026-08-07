/**
 * Tests 1 and 5 for spec 4 (page titles).
 *
 * Test 1: buildPageMetadata — returns the string the selector picks, for es/en/pt;
 *         returns a plain string (not a Next.js title object); does not include brand.
 * Test 5: Three sample pages — asserts expected human-readable titles via the helper
 *         using the same selector each page will call after implementation.
 */

import { describe, it, expect } from "vitest";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

// ─── Test 1: buildPageMetadata unit tests ────────────────────────────────────

describe("buildPageMetadata", () => {
  it("returns the dictionary value the picker selects (es)", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.parentNav.progress);
    expect(result.title).toBe("Progreso");
  });

  it("returns the dictionary value the picker selects (en)", async () => {
    const result = await buildPageMetadata("en", (d) => d.dashboard.parentNav.progress);
    expect(result.title).toBe("Progress");
  });

  it("returns the dictionary value the picker selects (pt)", async () => {
    const result = await buildPageMetadata("pt", (d) => d.dashboard.parentNav.progress);
    expect(result.title).toBe("Progresso");
  });

  it("title is a plain string, not a Next.js title object with default/template", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.parentNav.home);
    expect(typeof result.title).toBe("string");
    // Must not be an object (which would carry default/template and cause brand doubling)
    expect(result.title).not.toBeInstanceOf(Object);
  });

  it("title does not contain a | separator (i.e. does not self-append the brand)", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.parentNav.home);
    expect(result.title).toBe("Inicio");
    expect((result.title as string)).not.toContain("|");
  });
});

// ─── Test 5: three sample pages ─────────────────────────────────────────────
// Calls buildPageMetadata with the selectors each page will use after implementation,
// asserting the expected human-readable title in Spanish.

describe("sample page title selectors", () => {
  it("parent/progress page title is 'Progreso'", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.parentNav.progress);
    expect(result.title).toBe("Progreso");
  });

  it("student/calendar page title is 'Asistencias' after spec 6 F10 fix", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.studentNav.calendar);
    expect(result.title).toBe("Asistencias");
  });

  it("teacher/sections page title is 'Mis clases'", async () => {
    const result = await buildPageMetadata("es", (d) => d.dashboard.teacherMySections.metaTitle);
    expect(result.title).toBe("Mis clases");
  });
});
