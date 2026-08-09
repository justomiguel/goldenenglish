// REGRESSION CHECK: New parent screen/task tours must register a matrix row with path + anchors.
import { describe, expect, it } from "vitest";
import { listParentTourRuntimeChecks } from "@/lib/parent-tutorials/listTourRuntimeChecks";
import {
  listParentScreenTourIds,
  parentHomePath,
  parentScreenPath,
} from "@/lib/parent-tutorials/screenCatalog";
import { listParentTutorialIds } from "@/lib/parent-tutorials/catalog";
import { parentTutorialTargetPath } from "@/lib/parent-tutorials/buildParentTaskTourSteps";

describe("listParentTourRuntimeChecks", () => {
  it("covers every screen and task tour id", () => {
    const ids = new Set(listParentTourRuntimeChecks().map((c) => c.id));
    for (const id of listParentScreenTourIds()) {
      expect(ids.has(`screen:${id}`)).toBe(true);
    }
    for (const id of listParentTutorialIds()) {
      expect(ids.has(`task:${id}`)).toBe(true);
    }
  });

  it("every row resolves a path and declares at least one anchor", () => {
    for (const row of listParentTourRuntimeChecks()) {
      expect(row.anchors.length).toBeGreaterThan(0);
      const path = row.pathFor("es", { studentId: "00000000-0000-4000-8000-000000000001" });
      expect(path, row.id).toBeTruthy();
      expect(path!.startsWith("/es/")).toBe(true);
    }
  });

  it("maps billing screen smoke to payments fees tab", () => {
    const billing = listParentTourRuntimeChecks().find((r) => r.id === "screen:parent-billing");
    expect(billing?.pathFor("es", {})).toBe("/es/dashboard/parent/payments?tab=fees");
  });

  it("maps every child section smoke to its own route and title anchor", () => {
    const rowFor = (id: string) => listParentTourRuntimeChecks().find((r) => r.id === id);
    const cases: Array<[string, string, string]> = [
      ["screen:parent-attendance", "/es/dashboard/parent/child/attendance", "parent-attendance-title"],
      ["screen:parent-grades", "/es/dashboard/parent/child/grades", "parent-grades-title"],
      ["screen:parent-tasks", "/es/dashboard/parent/child/tasks", "parent-tasks-title"],
      ["screen:parent-feedback", "/es/dashboard/parent/child/feedback", "parent-feedback-title"],
      ["screen:parent-badges", "/es/dashboard/parent/child/badges", "parent-badges-title"],
      ["screen:parent-child", "/es/dashboard/parent/child", "parent-child-title"],
    ];
    for (const [id, path, anchor] of cases) {
      const row = rowFor(id);
      expect(row?.pathFor("es", {}), id).toBe(path);
      expect(row?.anchors, id).toEqual([anchor]);
    }

    const badgesTask = rowFor("task:parent-badges-overview");
    expect(badgesTask?.pathFor("es", {})).toBe("/es/dashboard/parent/child/badges");
    expect(badgesTask?.anchors).toEqual(["parent-badges-title"]);
  });

  it("task paths match parentTutorialTargetPath", () => {
    const studentId = "00000000-0000-4000-8000-000000000001";
    for (const id of listParentTutorialIds()) {
      const row = listParentTourRuntimeChecks().find((r) => r.id === `task:${id}`);
      expect(row?.pathFor("es", { studentId })).toBe(
        parentTutorialTargetPath(id, "es", { studentId }),
      );
    }
  });

  it("manage profile task requires a linked student for L3 path", () => {
    const row = listParentTourRuntimeChecks().find(
      (r) => r.id === "task:parent-manage-child-or-tutor-profile",
    );
    expect(row?.pathFor("es", {})).toBeNull();
    expect(row?.pathFor("es", { studentId: "00000000-0000-4000-8000-000000000001" })).toBe(
      "/es/dashboard/parent/child/edit?studentId=00000000-0000-4000-8000-000000000001",
    );
  });

  it("home screen path is parent dashboard root", () => {
    const home = listParentTourRuntimeChecks().find((r) => r.id === "screen:parent-home");
    expect(home?.pathFor("es", {})).toBe(parentHomePath("es"));
  });

  it("content screen paths use parentScreenPath helper", () => {
    const calendar = listParentTourRuntimeChecks().find((r) => r.id === "screen:parent-calendar");
    expect(calendar?.pathFor("es", {})).toBe(parentScreenPath("es", "parent-calendar"));
  });
});
