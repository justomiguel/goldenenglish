/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateEventPriceByFlowAction } from "@/app/[locale]/dashboard/admin/events/eventRegistrationFlowActions";

const { mockRequireAdminEventActor, createAdminClient, recordSystemAudit, revalidateEventFormSurfaces } =
  vi.hoisted(() => ({
    mockRequireAdminEventActor: vi.fn(),
    createAdminClient: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidateEventFormSurfaces: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/app/[locale]/dashboard/admin/events/eventActionsShared")
  >();
  return {
    ...actual,
    requireAdminEventActor: () => mockRequireAdminEventActor(),
    revalidateEventFormSurfaces: (...args: unknown[]) => revalidateEventFormSurfaces(...args),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));

const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

describe("event registration flow actions", () => {
  beforeEach(() => {
    mockRequireAdminEventActor.mockReset();
    createAdminClient.mockReset();
    recordSystemAudit.mockClear();
  });

  it("rejects a signed-out caller before writing the price mode", async () => {
    mockRequireAdminEventActor.mockResolvedValue(null);
    const result = await updateEventPriceByFlowAction({
      locale: "es",
      eventId: EVENT_ID,
      priceByFlow: true,
    });
    expect(result).toEqual({ ok: false, message: "forbidden" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuses flow pricing while an active ticket package exists", async () => {
    mockRequireAdminEventActor.mockResolvedValue("admin-1");
    const update = vi.fn();
    createAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "event_ticket_packages") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  limit: async () => ({ data: [{ id: "pkg" }], error: null }),
                }),
              }),
            }),
          };
        }
        return { update };
      },
    });

    const result = await updateEventPriceByFlowAction({
      locale: "es",
      eventId: EVENT_ID,
      priceByFlow: true,
    });
    expect(result).toEqual({ ok: false, message: "price_mode_conflict" });
    expect(update).not.toHaveBeenCalled();
  });
});
