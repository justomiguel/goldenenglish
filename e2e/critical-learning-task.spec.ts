import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker) && existsSync(paths.studentStorageState) && existsSync(paths.teacherStorageState);
const TASK_TITLE = "E2E Learning Task";

test.describe("@critical-learning-task", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("student submits a task and the teacher sees the answer", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(!sectionId, "E2E_SECTION_ID missing — re-run e2e:stack:up");
    const answer = `E2E answer ${Date.now()}`;

    const studentCtx = await browser.newContext({ storageState: paths.studentStorageState });
    const student = await studentCtx.newPage();
    await gotoIsolated(student, `/${locale}/dashboard/student/progress?tab=tasks`);
    await student.getByRole("link", { name: TASK_TITLE }).click();
    await expect(student).toHaveURL(/\/dashboard\/student\/tasks\//);
    await student.getByLabel(/tu respuesta|your answer/i).fill(answer);
    await student.getByRole("button", { name: /marcar como completada|mark as completed/i }).click();
    await expect(student.getByText(/tarea completada|task completed/i)).toBeVisible({ timeout: 30_000 });
    await studentCtx.close();

    const teacherCtx = await browser.newContext({ storageState: paths.teacherStorageState });
    const teacher = await teacherCtx.newPage();
    await gotoIsolated(teacher, `/${locale}/dashboard/teacher/sections/${sectionId}/tasks`);
    await expect(teacher.getByRole("heading", { name: /devolver una tarea|return a task/i })).toBeVisible({
      timeout: 30_000,
    });
    const card = teacher.locator("li").filter({ hasText: answer });
    await expect(card.getByText("Student E2E")).toBeVisible();
    await expect(card.getByText(TASK_TITLE)).toBeVisible();
    await expect(card.getByText(answer)).toBeVisible();
    await teacherCtx.close();
  });
});
