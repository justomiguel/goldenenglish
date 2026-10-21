/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminEventActor, rpc, recordSystemAudit } = vi.hoisted(() => ({
  mockRequireAdminEventActor: vi.fn(async () => "admin-1"),
  rpc: vi.fn(),
  recordSystemAudit: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", () => ({
  requireAdminEventActor: () => mockRequireAdminEventActor(),
  adminEventsPath: (locale: string) => `/${locale}/dashboard/admin/events`,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { deleteEventDiscountCodeAction } from "@/app/[locale]/dashboard/admin/events/eventDiscountCodeActions";

describe("deleteEventDiscountCodeAction", () => {
  beforeEach(() => {
    rpc.mockReset();
    recordSystemAudit.mockClear();
    mockRequireAdminEventActor.mockResolvedValue("admin-1");
  });

  it("refuses to delete a code that still has a reserved or confirmed use", async () => {
    rpc.mockResolvedValue({ data: "occupied", error: null });
    const result = await deleteEventDiscountCodeAction({
      locale: "es",
      eventId: "event-1",
      codeId: "code-1",
    });
    expect(result).toEqual({ ok: false, code: "occupied" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });
});
