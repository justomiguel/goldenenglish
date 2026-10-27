/** @vitest-environment node */
// REGRESSION CHECK: loadAdminStudentHistory must return cohort/section trajectory and chronological audit changes (profile, tutor before/after, and section enrollments) for a student.
import { describe, expect, it, vi } from "vitest";
import {
  loadAdminStudentHistory,
  mapAuditRowToStudentHistoryItem,
} from "@/lib/dashboard/loadAdminStudentHistory";

const studentId = "00000000-0000-4000-8000-000000000010";
const teacherId = "00000000-0000-4000-8000-000000000020";
const actorId = "00000000-0000-4000-8000-000000000030";
const section2026Id = "00000000-0000-4000-8000-000000002026";
const cohort2026Id = "00000000-0000-4000-8000-000000003026";

describe("mapAuditRowToStudentHistoryItem", () => {
  it("maps tutor change audit events with before and after values", () => {
    const item = mapAuditRowToStudentHistoryItem(
      {
        id: "aud-1",
        actor_id: actorId,
        actor_role: "admin",
        domain: "identity",
        action: "update_student_tutor",
        resource_type: "student_tutor",
        resource_id: studentId,
        summary: "Updated student guardian",
        before_values: { tutor: "Sosa, Marta (mother)" },
        after_values: { tutor: "Sosa, Pedro (father)" },
        diff: {
          tutor: {
            before: "Sosa, Marta (mother)",
            after: "Sosa, Pedro (father)",
          },
        },
        metadata: {},
        created_at: "2026-10-27T12:00:00.000Z",
      },
      new Map([[actorId, { id: actorId, first_name: "Ana", last_name: "Admin" }]]),
      "es",
      "—",
    );

    expect(item.kind).toBe("tutor");
    expect(item.actorName).toBe("Admin Ana");
    expect(item.changes).toEqual([
      {
        field: "tutor",
        before: "Sosa, Marta (mother)",
        after: "Sosa, Pedro (father)",
      },
    ]);
  });

  it("maps enrollment audit events to enrollment kind", () => {
    const item = mapAuditRowToStudentHistoryItem(
      {
        id: "aud-2",
        actor_id: actorId,
        actor_role: "admin",
        domain: "academic",
        action: "add_section",
        resource_type: "student_enrollment",
        resource_id: studentId,
        summary: "Added section",
        before_values: { section: "—" },
        after_values: { section: "2027 — Kids 2" },
        diff: {},
        metadata: {},
        created_at: "2026-10-27T13:00:00.000Z",
      },
      new Map(),
      "es",
      "—",
    );

    expect(item.kind).toBe("enrollment");
    expect(item.changes).toEqual([
      {
        field: "section",
        before: "—",
        after: "2027 — Kids 2",
      },
    ]);
  });
});

describe("loadAdminStudentHistory", () => {
  it("loads cohort trajectory and audit events for the student", async () => {
    const mockAdmin = {
      from: vi.fn((table: string) => {
        if (table === "section_enrollments") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: "enr-1",
                          section_id: section2026Id,
                          status: "active",
                          created_at: "2026-03-01T10:00:00.000Z",
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        if (table === "academic_sections") {
          return {
            select: () => ({
              in: () =>
                Promise.resolve({
                  data: [
                    {
                      id: section2026Id,
                      name: "Kids 1",
                      cohort_id: cohort2026Id,
                      teacher_id: teacherId,
                    },
                  ],
                  error: null,
                }),
            }),
          };
        }
        if (table === "academic_cohorts") {
          return {
            select: () => ({
              in: () =>
                Promise.resolve({
                  data: [
                    {
                      id: cohort2026Id,
                      name: "Ciclo 2026",
                      is_current: true,
                    },
                  ],
                  error: null,
                }),
            }),
          };
        }
        if (table === "audit_events") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: "aud-1",
                          actor_id: actorId,
                          actor_role: "admin",
                          domain: "identity",
                          action: "update_profile_field",
                          resource_type: "student_profile",
                          resource_id: studentId,
                          summary: "Updated phone",
                          before_values: { phone: "+5691111" },
                          after_values: { phone: "+5692222" },
                          diff: { phone: { before: "+5691111", after: "+5692222" } },
                          metadata: {},
                          created_at: "2026-10-27T12:00:00.000Z",
                        },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              in: () =>
                Promise.resolve({
                  data: [
                    { id: teacherId, first_name: "Ada", last_name: "Lovelace" },
                    { id: actorId, first_name: "Ana", last_name: "Admin" },
                  ],
                  error: null,
                }),
            }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const history = await loadAdminStudentHistory(
      mockAdmin as never,
      studentId,
      "es",
      "—",
    );

    expect(history.cohorts).toHaveLength(1);
    expect(history.cohorts[0]).toMatchObject({
      enrollmentId: "enr-1",
      cohortName: "Ciclo 2026",
      cohortIsCurrent: true,
      sectionName: "Kids 1",
      teacherName: "Lovelace Ada",
      status: "active",
    });

    expect(history.auditEvents).toHaveLength(1);
    expect(history.auditEvents[0]).toMatchObject({
      id: "aud-1",
      kind: "profile",
      actorName: "Admin Ana",
      changes: [{ field: "phone", before: "+5691111", after: "+5692222" }],
    });
  });
});
