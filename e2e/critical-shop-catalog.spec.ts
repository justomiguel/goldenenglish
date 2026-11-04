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
const authReady = existsSync(paths.readyMarker) && existsSync(paths.storageState);

test.describe("@critical-shop-catalog", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin publishes a product and the public catalog lists it", async ({ browser }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const title = `E2E Shop ${Date.now()}`;

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const admin = await adminCtx.newPage();
    await gotoIsolated(admin, `/${locale}/dashboard/admin/merch`);
    await admin.locator("#create-merch-title").fill(title);
    await admin.getByRole("button", { name: /crear producto|create product/i }).click();
    await expect(admin.getByRole("heading", { name: /variantes|variants/i })).toBeVisible({ timeout: 30_000 });
    await admin.locator("#var-new-color").fill("Azul");
    await admin.locator("#var-new-sku").fill(`E2E-${Date.now()}`);
    await admin.locator("#var-new-stock").fill("3");
    await admin.locator("#var-new-price").fill("1000");
    await admin.getByRole("button", { name: /agregar variante|add variant/i }).click();
    const row = admin.getByRole("row", { name: title });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole("button", { name: /activar|activate/i }).click();
    await expect(row.getByRole("button", { name: /pausar|pause/i })).toBeVisible({ timeout: 30_000 });
    await adminCtx.close();

    const guest = await browser.newPage();
    await gotoIsolated(guest, `/${locale}/tienda`);
    await expect(guest.getByRole("heading", { name: title })).toBeVisible({ timeout: 30_000 });
  });
});
