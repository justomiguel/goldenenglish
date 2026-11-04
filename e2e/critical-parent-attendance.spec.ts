import { test, expect, type Locator, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady =
  existsSync(paths.readyMarker) && existsSync(paths.storageState) && existsSync(paths.parentStorageState);
const STUDENT_LABEL = /Student\s+E2E/i;

async function cycleCellUntilPresent(cell: Locator) {
  for (let i = 0; i < 6; i++) {
    if ((await cell.innerText()).trim() === "P") return;
    await cell.click();
  }
  await expect(cell).toHaveText("P", { timeout: 5_000 });
}

function waitPresentAutosave(page: Page, cellKey: string) {
  return page.waitForResponse(
    async (r) => {
      if (!r.url().includes("/api/admin/attendance/cells") || r.request().method() !== "POST" || !r.ok()) {
        return false;
      }
      try {
        const body = r.request().postDataJSON() as {
          cells?: Array<{ enrollmentId?: string; attendedOn?: string; status?: string }>;
        } | null;
        const matchesCell = Boolean(
          body?.cells?.some(
            (c) =>
              c.status === "present" &&
              c.enrollmentId &&
              c.attendedOn &&
              `${c.enrollmentId}|${c.attendedOn}` === cellKey,
          ),
        );
        if (!matchesCell) return false;
        const json = (await r.json()) as { ok?: boolean };
        return json.ok === true;
      } catch {
        return false;
      }
    },
    { timeout: 30_000 },
  );
}

test.describe("@critical-parent-attendance", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin marks present and the parent sees that class", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(!cohortId || !sectionId, "E2E_COHORT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up");

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const admin = await adminCtx.newPage();
    await gotoIsolated(admin, `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`);
    await expect(admin.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionAttendanceMatrix))).toBeVisible({
      timeout: 60_000,
    });
    const cell = admin
      .getByRole("button", { name: STUDENT_LABEL })
      .and(admin.locator('button[data-att-can-edit="true"]'))
      .first();
    await expect(cell).toBeVisible({ timeout: 60_000 });
    const cellKey = await cell.getAttribute("data-att-cell");
    if (!cellKey) throw new Error("missing data-att-cell on editable attendance cell");
    if ((await cell.innerText()).trim() !== "P") {
      const saveDone = waitPresentAutosave(admin, cellKey);
      await cycleCellUntilPresent(cell);
      await saveDone;
    }
    await adminCtx.close();

    const parentCtx = await browser.newContext({ storageState: paths.parentStorageState });
    const parent = await parentCtx.newPage();
    await gotoIsolated(parent, `/${locale}/dashboard/parent/child/attendance`);
    const marks = parent.getByRole("button", { name: /registros recientes|latest records|recent records/i });
    await expect(marks.first()).toBeVisible({ timeout: 30_000 });
    await marks.first().click();
    await expect(parent.getByText(/^presente$|^present$/i).first()).toBeVisible({ timeout: 30_000 });
    await parentCtx.close();
  });
});
