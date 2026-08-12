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
const authReady = existsSync(paths.readyMarker);

/** Surname-first label for seeded e2e-student (Student / E2E). */
const STUDENT_LABEL = /Student\s+E2E/i;

async function cycleCellUntilPresent(cell: Locator) {
  // Admin cycle: null→P→A→T→J→P. Cap clicks so a stuck UI fails loudly.
  for (let i = 0; i < 6; i++) {
    if ((await cell.innerText()).trim() === "P") return;
    await cell.click();
  }
  await expect(cell).toHaveText("P", { timeout: 5_000 });
}

/** Autosave POST that includes at least one `present` mark (debounced batch). */
function waitPresentAutosave(page: Page) {
  return page.waitForResponse(
    (r) => {
      if (
        !r.url().includes("/api/admin/attendance/cells") ||
        r.request().method() !== "POST" ||
        !r.ok()
      ) {
        return false;
      }
      try {
        const body = r.request().postDataJSON() as {
          cells?: Array<{ status?: string }>;
        } | null;
        return Boolean(body?.cells?.some((c) => c.status === "present"));
      } catch {
        return false;
      }
    },
    { timeout: 30_000 },
  );
}

test.describe("@critical-attendance", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin marks one attendance cell and it persists after refresh", async ({ page }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(!cohortId || !sectionId, "E2E_COHORT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up");

    await gotoIsolated(
      page,
      `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`,
    );
    await expect(page.getByRole("heading", { name: /^404$/i })).toHaveCount(0);
    await expect(
      page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionAttendanceMatrix)),
    ).toBeVisible({ timeout: 60_000 });

    // Cells show P/A/T (not the Presente legend). Aria is "Asistencia de {student} el {date}".
    const cell = page
      .getByRole("button", { name: STUDENT_LABEL })
      .and(page.locator('button[data-att-can-edit="true"]'))
      .first();
    await expect(cell).toBeVisible({ timeout: 60_000 });
    const cellKey = await cell.getAttribute("data-att-cell");
    expect(cellKey).toBeTruthy();

    // Matrix autosaves (~550ms debounce) — there is no Guardar asistencia floating CTA.
    const saveDone = waitPresentAutosave(page);
    if ((await cell.innerText()).trim() === "P") {
      await cell.click();
    }
    await cycleCellUntilPresent(cell);
    await saveDone;

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionAttendanceMatrix)),
    ).toBeVisible({ timeout: 60_000 });

    const persisted = page.locator(`button[data-att-cell="${cellKey}"]`);
    await expect(persisted).toBeVisible({ timeout: 60_000 });
    await expect(persisted).toHaveText("P", { timeout: 15_000 });
  });
});
