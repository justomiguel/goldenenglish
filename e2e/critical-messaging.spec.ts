import { test, expect } from "@playwright/test";
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

test.describe("@critical-messaging", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin sends portal message → student inbox shows it", async ({ browser }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const marker = `E2E msg ${Date.now().toString(36)}`;

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin/messages/compose`);
    await expect(
      adminPage.getByRole("heading", { name: /Escribir mensaje|Write message/i }),
    ).toBeVisible({ timeout: 20_000 });

    const recipient = adminPage.getByRole("combobox", { name: /Para|To/i });
    await recipient.click();
    await recipient.fill("Student");
    const studentOption = adminPage.getByRole("option", { name: STUDENT_LABEL }).first();
    await expect(studentOption).toBeVisible({ timeout: 15_000 });
    await studentOption.click();
    await expect(recipient).toHaveValue(STUDENT_LABEL);

    const body = adminPage.locator(
      `${adminTourSelector(ADMIN_TOUR_ANCHORS.messagesComposeBody)} .ProseMirror`,
    );
    await expect(body).toBeVisible({ timeout: 10_000 });
    await body.click();
    await adminPage.keyboard.type(marker, { delay: 10 });
    await expect(body).toContainText(marker);

    const sendBtn = adminPage.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.messagesComposeSend));
    await expect(sendBtn).toBeEnabled({ timeout: 10_000 });
    await sendBtn.click();

    // Product navigates to the mailbox list on success (composeSent is skipped when
    // successNavigateTo is set). Surface compose errors instead of hanging on URL.
    const composeErr = adminPage.getByText(/No se pudo enviar|could not send|Error/i);
    await Promise.race([
      adminPage.waitForURL(new RegExp(`/${locale}/dashboard/admin/messages(?:\\?.*)?$`), {
        timeout: 30_000,
      }),
      composeErr.waitFor({ state: "visible", timeout: 30_000 }).then(async () => {
        throw new Error(`compose failed: ${(await composeErr.textContent()) ?? ""}`);
      }),
    ]);
    await expect(
      adminPage.getByRole("heading", { name: /Mensajes|Messages/i }),
    ).toBeVisible({ timeout: 15_000 });
    await adminCtx.close();

    const studentCtx = await browser.newContext({
      storageState: paths.studentStorageState,
    });
    const studentPage = await studentCtx.newPage();
    await gotoIsolated(studentPage, `/${locale}/dashboard/student/messages`);
    await expect(studentPage.getByText(marker)).toBeVisible({ timeout: 30_000 });
    await studentCtx.close();
  });
});
