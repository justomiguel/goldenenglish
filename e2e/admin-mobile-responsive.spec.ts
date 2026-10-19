import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

const WIDTHS = [320, 375, 430, 768, 1024, 1440] as const;

/** Routes with no dynamic segment. Redirect-only pages are still visited. */
const STATIC_ADMIN_ROUTES = [
  "/dashboard/admin",
  "/dashboard/admin/academic",
  "/dashboard/admin/academic/contents",
  "/dashboard/admin/academic/contents/sections",
  "/dashboard/admin/academic/contents/global/new",
  "/dashboard/admin/academics",
  "/dashboard/admin/analytics",
  "/dashboard/admin/audit",
  "/dashboard/admin/badges",
  "/dashboard/admin/badges/new",
  "/dashboard/admin/calendar",
  "/dashboard/admin/calendar/special",
  "/dashboard/admin/changelog",
  "/dashboard/admin/cms",
  "/dashboard/admin/cms/blog",
  "/dashboard/admin/cms/blog/new",
  "/dashboard/admin/cms/blog/review",
  "/dashboard/admin/cms/blog/comments",
  "/dashboard/admin/cms/templates",
  "/dashboard/admin/communications/templates",
  "/dashboard/admin/coupons",
  "/dashboard/admin/events",
  "/dashboard/admin/events/new",
  "/dashboard/admin/finance",
  "/dashboard/admin/finance/collections",
  "/dashboard/admin/finance/receipts",
  "/dashboard/admin/glossary",
  "/dashboard/admin/institute",
  "/dashboard/admin/merch",
  "/dashboard/admin/merch/orders",
  "/dashboard/admin/messages",
  "/dashboard/admin/messages/compose",
  "/dashboard/admin/parents",
  "/dashboard/admin/parents/compose",
  "/dashboard/admin/payments",
  "/dashboard/admin/promotions",
  "/dashboard/admin/registrations",
  "/dashboard/admin/requests",
  "/dashboard/admin/retention",
  "/dashboard/admin/settings",
  "/dashboard/admin/settings/integrations",
  "/dashboard/admin/settings/questionnaires",
  "/dashboard/admin/site-setup",
  "/dashboard/admin/students",
  "/dashboard/admin/teachers",
  "/dashboard/admin/users",
  "/dashboard/admin/users/import",
  "/dashboard/admin/users/new",
] as const;

/**
 * Dynamic admin routes the isolated seed cannot open without a specific row.
 * Listed so the sweep report stays honest.
 */
const UNSEEDED_DYNAMIC_ROUTES = [
  "/dashboard/admin/settings/questionnaires/[id]",
  "/dashboard/admin/settings/questionnaires/[id]/results",
  "/dashboard/admin/academic/contents/sections/[sectionId]/edit",
  "/dashboard/admin/academic/contents/global/[contentId]",
  "/dashboard/admin/academic/contents/global/[contentId]/edit",
  "/dashboard/admin/cms/blog/[id]/edit",
  "/dashboard/admin/cms/blog/[id]/translations/[targetLocale]",
  "/dashboard/admin/messages/[messageId]",
  "/dashboard/admin/calendar/special/[id]",
  "/dashboard/admin/cms/templates/[id]",
  "/dashboard/admin/cms/templates/[id]/properties",
  "/dashboard/admin/cms/templates/[id]/landing",
  "/dashboard/admin/cms/templates/[id]/landing/[section]",
  "/dashboard/admin/cms/templates/[id]/hero",
  "/dashboard/admin/badges/[badgeId]",
] as const;

function seededDynamicRoutes(): { label: string; path: string }[] {
  const cohortId = process.env.E2E_COHORT_ID?.trim();
  const sectionId = process.env.E2E_SECTION_ID?.trim();
  const studentId = process.env.E2E_STUDENT_ID?.trim();
  const eventId = process.env.E2E_EVENT_ID?.trim();
  const receiptId = process.env.E2E_RECEIPT_ID?.trim();
  const routes: { label: string; path: string }[] = [];
  if (cohortId) routes.push({ label: "cohort", path: `/dashboard/admin/academic/${cohortId}` });
  if (cohortId && sectionId) {
    routes.push({
      label: "section",
      path: `/dashboard/admin/academic/${cohortId}/${sectionId}`,
    });
    routes.push({
      label: "attendance",
      path: `/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`,
    });
  }
  if (sectionId) {
    routes.push({
      label: "collections-matrix",
      path: `/dashboard/admin/finance/collections/${sectionId}`,
    });
  }
  if (studentId) {
    routes.push({ label: "user", path: `/dashboard/admin/users/${studentId}` });
    routes.push({ label: "billing", path: `/dashboard/admin/users/${studentId}/billing` });
  }
  if (eventId) routes.push({ label: "event", path: `/dashboard/admin/events/${eventId}` });
  if (receiptId) {
    routes.push({ label: "receipt", path: `/dashboard/admin/finance/receipts/${receiptId}` });
  }
  return routes;
}

test.describe("@admin-mobile-responsive", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("records dynamic routes the seed cannot open", () => {
    test.info().annotations.push({
      type: "not-validated",
      description: UNSEEDED_DYNAMIC_ROUTES.join(", "),
    });
  });

  const cases = [
    ...STATIC_ADMIN_ROUTES.map((path) => ({ label: path, path })),
    ...seededDynamicRoutes(),
  ];

  for (const route of cases) {
    test(`${route.label} fits 320–1440`, async ({ page }) => {
      test.setTimeout(180_000);
      const locale = isolation.ok ? isolation.locale : "es";
      const dir = "test-results/admin-mobile";
      await mkdir(dir, { recursive: true });
      await gotoIsolated(page, `/${locale}${route.path}`);

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 800 });
        await page.waitForTimeout(150);
        const report = await page.evaluate((narrow) => {
          const overflow = document.documentElement.scrollWidth - window.innerWidth;
          const offscreen: string[] = [];
          const small: string[] = [];
          document.querySelectorAll("button, a, input, select, textarea").forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            const style = getComputedStyle(node);
            if (style.visibility === "hidden" || style.display === "none") return;
            const rect = node.getBoundingClientRect();
            if (rect.width < 1 || rect.height < 1) return;
            if (node.closest("[data-allow-x-scroll]")) return;
            if (rect.left < -1 || rect.right > window.innerWidth + 1) {
              const name = (node.getAttribute("aria-label") || node.textContent || node.tagName)
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 60);
              offscreen.push(name);
            }
            if (!narrow) return;
            if (node.tagName === "A") return;
            if (node instanceof HTMLInputElement && (node.type === "checkbox" || node.type === "radio" || node.type === "hidden")) {
              return;
            }
            if (rect.height < 44 || (node.tagName === "BUTTON" && rect.width < 44 && rect.height < 44)) {
              const name = (node.getAttribute("aria-label") || node.textContent || node.tagName)
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 60);
              small.push(`${name} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
            }
          });
          return { overflow, offscreen: offscreen.slice(0, 8), small: small.slice(0, 8) };
        }, width < 768);

        const slug = route.path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
        await page.screenshot({
          path: `${dir}/${slug}-${width}.png`,
          fullPage: false,
        });

        expect(report.overflow, `${route.path} @ ${width}px overflow ${report.overflow}`).toBeLessThanOrEqual(1);
        expect(report.offscreen, `${route.path} @ ${width}px off-screen`).toEqual([]);
        expect(report.small, `${route.path} @ ${width}px under 44px`).toEqual([]);
      }
    });
  }
});
