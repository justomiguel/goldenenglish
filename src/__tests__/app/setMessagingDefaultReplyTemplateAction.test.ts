// REGRESSION CHECK: Save action must assertAdmin and reject invalid lengths before upsert.
import { beforeEach, describe, expect, it, vi } from "vitest";

const assertAdmin = vi.fn();
const updateMessagingDefaultReplyTemplate = vi.fn();
const recordSystemAudit = vi.fn();
const revalidatePath = vi.fn();
const createClient = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: (...args: unknown[]) => assertAdmin(...args),
}));
vi.mock("@/lib/messaging/updateMessagingDefaultReplyTemplate", () => ({
  updateMessagingDefaultReplyTemplate: (...args: unknown[]) =>
    updateMessagingDefaultReplyTemplate(...args),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => recordSystemAudit(...args),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

describe("setMessagingDefaultReplyTemplateAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createClient.mockResolvedValue({ id: "sb" });
    assertAdmin.mockResolvedValue(undefined);
    updateMessagingDefaultReplyTemplate.mockResolvedValue({ ok: true });
  });

  it("returns unauthorized when assertAdmin throws", async () => {
    assertAdmin.mockRejectedValue(new Error("nope"));
    const { setMessagingDefaultReplyTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/messages/defaultReplyActions"
    );
    const r = await setMessagingDefaultReplyTemplateAction("es", {
      es: "Hello",
      en: "Hello",
      pt: "Hello",
    });
    expect(r).toEqual({ ok: false, error: "unauthorized" });
    expect(updateMessagingDefaultReplyTemplate).not.toHaveBeenCalled();
  });

  it("saves, audits, and revalidates on success", async () => {
    const { setMessagingDefaultReplyTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/messages/defaultReplyActions"
    );
    const templates = {
      es: "Gracias {{instituteName}}",
      en: "Thanks {{instituteName}}",
      pt: "Obrigado {{instituteName}}",
    };
    const r = await setMessagingDefaultReplyTemplateAction("en", templates);
    expect(r).toEqual({ ok: true });
    expect(updateMessagingDefaultReplyTemplate).toHaveBeenCalledWith({ id: "sb" }, templates);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "messaging.default_reply_template.update",
        resourceType: "site_settings",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/messages", "layout");
  });
});
