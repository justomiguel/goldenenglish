import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import es from "../src/dictionaries/es.json";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

const L = es.admin.users;

test.describe("@critical-student-care", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin records a care note and the student gets flagged", async ({ page }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const studentId = process.env.E2E_STUDENT_ID?.trim();
    test.skip(!studentId, "E2E_STUDENT_ID missing — re-run e2e:stack:up");

    const note = `Asma leve ${Date.now().toString(36)}`;

    await gotoIsolated(page, `/${locale}/dashboard/admin/users/${studentId}`);
    await page.getByRole("tab", { name: new RegExp(L.detailTabCare) }).click();

    const health = page.getByLabel(L.detailFieldCareHealth);
    await expect(health).toBeVisible({ timeout: 20_000 });
    await health.fill(note);
    await page.getByRole("button", { name: L.detailConfirmSave, exact: true }).click();

    await expect(page.getByText(L.detailCareSaved)).toBeVisible({ timeout: 20_000 });

    // The badge is the whole point of the flag: staff must see that this
    // student needs care without the note being anywhere near the page.
    await page.reload();
    await expect(page.getByLabel(L.detailCareBadge).first()).toBeVisible({ timeout: 20_000 });
  });

  /**
   * The static guard in `profilesCarePrivilegeAllowlist.test.ts` only reads the
   * migration text. This is the half it cannot do: it proves the REVOKE/GRANT
   * actually took effect in the running database. Column privileges are checked
   * before RLS, so the request fails outright rather than returning empty rows —
   * which is why an empty 200 would not count as proof.
   *
   * Delete the REVOKE from migration 181 and this test must go red.
   */
  test("the database itself refuses to hand out a care note", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    test.skip(!url || !anon, "Supabase URL / anon key missing — re-run e2e:stack:up");

    const headers = { apikey: anon!, Authorization: `Bearer ${anon}` };

    // Control: the same table, a column the role is allowed to read. An empty
    // result is fine here; what matters is that the request itself succeeds,
    // so a failure below cannot be blamed on a broken endpoint.
    const allowed = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, { headers });
    expect(allowed.ok).toBe(true);

    const denied = await fetch(`${url}/rest/v1/profiles?select=care_health_note&limit=1`, {
      headers,
    });
    expect(denied.ok).toBe(false);
    const body = await denied.text();
    expect(body).toMatch(/42501|permission denied/i);
  });
});
