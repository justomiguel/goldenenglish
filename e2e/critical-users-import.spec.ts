import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-users-import", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin can import one teacher via spreadsheet dry-run + apply", async ({ page }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-import-${suffix}@example.test`;
    const dni = `E2EI${suffix}`.slice(0, 12);

    const csv = [
      "email,role,first_name,last_name,dni_or_passport",
      `${email},teacher,Import,E2E${suffix},${dni}`,
      "",
    ].join("\n");

    await page.goto(`/${locale}/dashboard/admin/users/import`);
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 20_000 });
    await expect(page.locator("button").filter({ hasText: /Elegir archivo Excel|Choose Excel/i })).toBeVisible();

    await fileInput.setInputFiles({
      name: "e2e-users-import.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv, "utf8"),
    });

    // ConfirmActionModal title (dictionary-backed)
    await expect(page.getByText(/Vista previa de importaci[oó]n|Import preview/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Cuentas nuevas:\s*1|New accounts:\s*1/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /OK — aplicar importaci[oó]n|OK — apply/i }).click();

    await expect(page.getByText(/Resultado de la importaci[oó]n|Import result/i)).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Creados:\s*1|Created:\s*1/i)).toBeVisible({ timeout: 10_000 });
  });
});
