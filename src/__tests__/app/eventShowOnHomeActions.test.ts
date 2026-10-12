/** @vitest-environment node */
// REGRESSION CHECK: Marking an event for the home popup must be admin-only,
// persist show_on_home, audit the flag, and refresh the public home.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateEventShowOnHomeAction } from "@/app/[locale]/dashboard/admin/events/eventShowOnHomeActions";

const { mockRequireAdminEventActor, createAdminClient, recordSystemAudit, revalidatePath } =
  vi.hoisted(() => ({
    mockRequireAdminEventActor: vi.fn(),
    createAdminClient: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
  }));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/app/[locale]/dashboard/admin/events/eventActionsShared")
  >();
  return { ...actual, requireAdminEventActor: () => mockRequireAdminEventActor() };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));

vi.mock("next/cache", () => ({ revalidatePath }));

const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";

describe("updateEventShowOnHomeAction", () => {
  beforeEach(() => {
    mockRequireAdminEventActor.mockReset();
    createAdminClient.mockReset();
    recordSystemAudit.mockClear();
    revalidatePath.mockClear();
  });

  it("rejects a signed-out caller before writing", async () => {
    mockRequireAdminEventActor.mockResolvedValue(null);
    const result = await updateEventShowOnHomeAction({
      locale: "es",
      eventId: EVENT_ID,
      showOnHome: true,
    });
    expect(result).toEqual({ ok: false, message: "forbidden" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("saves the flag, audits it, and revalidates the home", async () => {
    mockRequireAdminEventActor.mockResolvedValue("admin-1");
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    createAdminClient.mockReturnValue({ from: () => ({ update }) });

    const result = await updateEventShowOnHomeAction({
      locale: "es",
      eventId: EVENT_ID,
      showOnHome: true,
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ show_on_home: true });
    expect(eq).toHaveBeenCalledWith("id", EVENT_ID);
    expect(recordSystemAudit).toHaveBeenCalledWith({
      action: "event_show_on_home_updated",
      resourceType: "event",
      resourceId: EVENT_ID,
      payload: { show_on_home: true },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/es", "page");
  });
});
