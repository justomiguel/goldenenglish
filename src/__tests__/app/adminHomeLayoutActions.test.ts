/** @vitest-environment node */
// REGRESSION CHECK: A home layout save writes only the signed-in admin,
// refreshes the admin home, and does not audit a personal preference.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteAdminHomeLayoutAction,
  saveAdminHomeLayoutAction,
} from "@/app/[locale]/dashboard/admin/adminHomeLayoutActions";
import { ADMIN_SESSION_FORBIDDEN } from "@/lib/dashboard/adminSessionErrors";
import { factoryAdminHomeLayout } from "@/lib/dashboard/adminHomeLayout";

const { assertAdmin, loadMerchEnabled, revalidatePath, recordSystemAudit } = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  loadMerchEnabled: vi.fn(),
  revalidatePath: vi.fn(),
  recordSystemAudit: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({ assertAdmin: () => assertAdmin() }));
vi.mock("@/lib/shop/loadMerchEnabled", () => ({ loadMerchEnabled: () => loadMerchEnabled() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));

const USER_ID = "00000000-0000-4000-8000-0000000000a1";

describe("saveAdminHomeLayoutAction", () => {
  beforeEach(() => {
    assertAdmin.mockReset();
    loadMerchEnabled.mockReset();
    revalidatePath.mockClear();
    recordSystemAudit.mockClear();
    loadMerchEnabled.mockResolvedValue(true);
  });

  it("rejects a non-admin before writing", async () => {
    assertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    const result = await saveAdminHomeLayoutAction({
      locale: "es",
      layout: factoryAdminHomeLayout({ shopEnabled: true }),
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts the session user and revalidates the admin home", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    assertAdmin.mockResolvedValue({
      user: { id: USER_ID },
      supabase: { from: () => ({ upsert }) },
    });
    const layout = factoryAdminHomeLayout({ shopEnabled: true });
    const result = await saveAdminHomeLayoutAction({ locale: "es", layout });
    expect(result).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ profile_id: USER_ID, layout }),
      { onConflict: "profile_id" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin");
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("drops shop orders when the shop is off", async () => {
    loadMerchEnabled.mockResolvedValue(false);
    const upsert = vi.fn().mockResolvedValue({ error: null });
    assertAdmin.mockResolvedValue({
      user: { id: USER_ID },
      supabase: { from: () => ({ upsert }) },
    });
    await saveAdminHomeLayoutAction({
      locale: "en",
      layout: factoryAdminHomeLayout({ shopEnabled: true }),
    });
    const saved = upsert.mock.calls[0]?.[0] as { layout: { items: { id: string }[] } };
    expect(saved.layout.items.map((item) => item.id)).not.toContain("shopOrders");
  });
});

describe("deleteAdminHomeLayoutAction", () => {
  it("deletes only the session user row", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    assertAdmin.mockResolvedValue({
      user: { id: USER_ID },
      supabase: { from: () => ({ delete: del }) },
    });
    const result = await deleteAdminHomeLayoutAction({ locale: "pt" });
    expect(result).toEqual({ ok: true });
    expect(eq).toHaveBeenCalledWith("profile_id", USER_ID);
    expect(revalidatePath).toHaveBeenCalledWith("/pt/dashboard/admin");
  });
});

describe("admin home layout action source", () => {
  it("does not import the system audit writer", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/[locale]/dashboard/admin/adminHomeLayoutActions.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/recordSystemAudit/);
  });
});
