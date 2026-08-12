import { test, expect, type Browser, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  parentTourSelector,
  PARENT_TOUR_ANCHORS,
} from "../src/lib/parent-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

async function expectHeadingLandmark(page: Page, name?: RegExp) {
  const heading = name
    ? page.getByRole("heading", { name }).first()
    : page.getByRole("heading").first();
  await expect(heading).toBeVisible({ timeout: 20_000 });
}

/**
 * Read-only hub smokes. Deep links match portal shell / teacher sidebar
 * destinations — no forms submitted.
 */
test.describe("@portal-smoke-hubs", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("student hub + payments + messages landmarks", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const base = `/${locale}/dashboard/student`;
    // buildStudentShellConfig destinations: payments, messages
    await smokeRole(browser, paths.studentStorageState, [
      {
        path: base,
        landmark: async (page) => {
          await expectHeadingLandmark(page);
        },
      },
      {
        path: `${base}/payments`,
        landmark: async (page) => {
          await expect(
            page
              .locator(parentTourSelector(PARENT_TOUR_ANCHORS.paymentsTitle))
              .or(page.getByRole("heading", { name: /Cuotas|Payments|Pagos/i }))
              .first(),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
      {
        path: `${base}/messages`,
        landmark: async (page) => {
          await expectHeadingLandmark(page, /Mensajes|Messages/i);
        },
      },
    ]);
  });

  test("parent hub + child + payments landmarks", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const base = `/${locale}/dashboard/parent`;
    // buildParentShellConfig destinations: child, payments
    await smokeRole(browser, paths.parentStorageState, [
      {
        path: base,
        landmark: async (page) => {
          await expect(
            page
              .locator(parentTourSelector(PARENT_TOUR_ANCHORS.homeTitle))
              .or(page.getByRole("heading").first())
              .first(),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
      {
        path: `${base}/child`,
        landmark: async (page) => {
          await expect(
            page
              .locator(parentTourSelector(PARENT_TOUR_ANCHORS.childTitle))
              .or(page.getByRole("heading").first())
              .first(),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
      {
        path: `${base}/payments`,
        landmark: async (page) => {
          await expect(
            page
              .locator(parentTourSelector(PARENT_TOUR_ANCHORS.paymentsTitle))
              .or(page.getByRole("heading", { name: /Cuotas|Payments|Pagos/i }))
              .first(),
          ).toBeVisible({ timeout: 20_000 });
        },
      },
    ]);
  });

  test("teacher hub + sections landmarks", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const base = `/${locale}/dashboard/teacher`;
    // TeacherSidebarNavContent: sections + calendar
    await smokeRole(browser, paths.teacherStorageState, [
      {
        path: base,
        landmark: async (page) => {
          await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/teacher`));
          await expectHeadingLandmark(page);
          await expect(
            page.getByText(/Área docente|Teacher area|Mis clases hoy/i).first(),
          ).toBeVisible({ timeout: 15_000 });
        },
      },
      {
        path: `${base}/sections`,
        landmark: async (page) => {
          await expectHeadingLandmark(page, /Mis secciones|My sections|Mis clases/i);
        },
      },
      {
        path: `${base}/calendar`,
        landmark: async (page) => {
          await expectHeadingLandmark(page, /Mi agenda|My schedule|Calendario/i);
        },
      },
    ]);
  });
});

type SmokeStep = {
  path: string;
  landmark: (page: Page) => Promise<void>;
};

async function smokeRole(
  browser: Browser,
  storageState: string,
  steps: SmokeStep[],
) {
  test.setTimeout(120_000);
  expect(
    existsSync(storageState),
    `Missing storage: ${storageState}`,
  ).toBeTruthy();
  const ctx = await browser.newContext({ storageState });
  const page = await ctx.newPage();
  try {
    for (const step of steps) {
      await gotoIsolated(page, step.path);
      await step.landmark(page);
    }
  } finally {
    await ctx.close();
  }
}
