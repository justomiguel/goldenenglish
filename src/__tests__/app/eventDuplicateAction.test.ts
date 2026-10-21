/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdminEventActor, duplicateEventServer, recordSystemAudit } = vi.hoisted(() => ({
  mockRequireAdminEventActor: vi.fn(),
  duplicateEventServer: vi.fn(),
  recordSystemAudit: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", () => ({
  requireAdminEventActor: () => mockRequireAdminEventActor(),
  adminEventsPath: (locale: string) => `/${locale}/dashboard/admin/events`,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ kind: "admin" }) }));
vi.mock("@/lib/events/server/duplicateEventServer", () => ({ duplicateEventServer }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { duplicateEventAction } from "@/app/[locale]/dashboard/admin/events/eventDuplicateAction";

describe("duplicateEventAction", () => {
  beforeEach(() => {
    mockRequireAdminEventActor.mockReset();
    duplicateEventServer.mockReset();
    recordSystemAudit.mockClear();
  });

  it("rejects a signed-out caller before copying", async () => {
    mockRequireAdminEventActor.mockResolvedValue(null);
    const result = await duplicateEventAction({ locale: "es", eventId: "event-1" });
    expect(result).toEqual({ ok: false, message: "forbidden" });
    expect(duplicateEventServer).not.toHaveBeenCalled();
  });
});
