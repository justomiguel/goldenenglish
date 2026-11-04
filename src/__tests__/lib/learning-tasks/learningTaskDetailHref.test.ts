import { describe, expect, it } from "vitest";
import { learningTaskDetailHref } from "@/lib/learning-tasks/learningTaskDetailHref";

describe("learningTaskDetailHref", () => {
  it("keeps the parent tutor link when no student base is set", () => {
    expect(
      learningTaskDetailHref({
        locale: "es",
        taskInstanceId: "task-1",
        studentId: "student-1",
      }),
    ).toBe("/es/dashboard/parent/tasks/task-1?studentId=student-1");
  });

  it("opens the student task when the progress screen is the student screen", () => {
    expect(
      learningTaskDetailHref({
        locale: "es",
        taskInstanceId: "task-1",
        studentId: "student-1",
        taskDetailBase: "/es/dashboard/student/tasks",
      }),
    ).toBe("/es/dashboard/student/tasks/task-1");
  });
});
