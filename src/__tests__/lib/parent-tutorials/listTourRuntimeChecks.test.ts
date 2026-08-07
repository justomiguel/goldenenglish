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

  it("maps tasks/assessments/badges smokes to progress hub tabs with body anchors", () => {
    const tasks = listParentTourRuntimeChecks().find((r) => r.id === "screen:parent-tasks");
    const assessments = listParentTourRuntimeChecks().find(
      (r) => r.id === "screen:parent-assessments",
    );
    const badges = listParentTourRuntimeChecks().find((r) => r.id === "screen:parent-badges");
    const badgesTask = listParentTourRuntimeChecks().find(
      (r) => r.id === "task:parent-badges-overview",
    );
    expect(tasks?.pathFor("es", {})).toBe("/es/dashboard/parent/progress?tab=tasks");
    expect(assessments?.pathFor("es", {})).toBe(
      "/es/dashboard/parent/progress?tab=assessments",
    );
    expect(badges?.pathFor("es", {})).toBe("/es/dashboard/parent/progress?tab=badges");
    expect(badgesTask?.pathFor("es", {})).toBe("/es/dashboard/parent/progress?tab=badges");
    expect(tasks?.anchors).toEqual(["parent-tasks-list"]);
    expect(assessments?.anchors).toEqual(["parent-assessments-body"]);
    expect(badges?.anchors).toEqual(["parent-badges-body"]);
    expect(badgesTask?.anchors).toEqual(["parent-badges-body"]);
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
      "/es/dashboard/parent/children/00000000-0000-4000-8000-000000000001",
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
