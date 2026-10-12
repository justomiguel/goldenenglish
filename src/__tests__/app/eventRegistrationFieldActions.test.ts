/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  updateEventBaseFieldRequirementsAction,
  updateEventRegistrationFieldOrderAction,
} from "@/app/[locale]/dashboard/admin/events/eventRegistrationFieldActions";

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
const FIELD_ID = "11111111-1111-4111-8111-111111111111";

describe("event registration field actions", () => {
  beforeEach(() => {
    mockRequireAdminEventActor.mockReset();
    createAdminClient.mockReset();
    recordSystemAudit.mockClear();
    revalidateEventFormSurfaces.mockClear();
  });

  it("rejects a signed-out caller before writing the order", async () => {
    mockRequireAdminEventActor.mockResolvedValue(null);
    const result = await updateEventRegistrationFieldOrderAction({
      locale: "es",
      eventId: EVENT_ID,
      order: ["base:phone"],
    });
    expect(result).toEqual({ ok: false, message: "forbidden" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("keeps a hidden birth-date token and audits the saved order", async () => {
    mockRequireAdminEventActor.mockResolvedValue("admin-1");
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });
    createAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "event_form_fields") {
          return {
            select: () => ({
              eq: () => ({
                is: () => ({
                  in: async () => ({ data: [{ id: FIELD_ID }], error: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  registration_field_order: ["base:phone", "base:birthDate", "base:email"],
                  collect_birth_date: false,
                },
                error: null,
              }),
            }),
          }),
          update,
        };
      },
    });

    const result = await updateEventRegistrationFieldOrderAction({
      locale: "es",
      eventId: EVENT_ID,
      order: ["base:phone", `field:${FIELD_ID}`, "base:email"],
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      registration_field_order: ["base:phone", `field:${FIELD_ID}`, "base:birthDate", "base:email"],
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "event_registration_field_order_updated", resourceId: EVENT_ID }),
    );
    expect(revalidateEventFormSurfaces).toHaveBeenCalledWith("es", EVENT_ID);
  });

  it("refuses to require a birth date while collection is off", async () => {
    mockRequireAdminEventActor.mockResolvedValue("admin-1");
    const update = vi.fn();
    createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { collect_birth_date: false }, error: null }),
          }),
        }),
        update,
      }),
    });

    const result = await updateEventBaseFieldRequirementsAction({
      locale: "es",
      eventId: EVENT_ID,
      requirePhone: true,
      requireBirthDate: true,
    });

    expect(result).toEqual({ ok: false, message: "validation_failed" });
    expect(update).not.toHaveBeenCalled();
  });
});
