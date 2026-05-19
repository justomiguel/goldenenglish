/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendParentMessageToAdministrationUseCase } from "@/lib/messaging/useCases/sendParentMessageToAdministration";
import {
  MESSAGING_UC_INVALID_RECIPIENT,
  MESSAGING_UC_NO_ADMINS,
} from "@/lib/messaging/messagingUseCaseCodes";
import { notifyPortalRecipientForStaffMessage } from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyPortalRecipientForStaffMessage: vi.fn(),
}));

describe("sendParentMessageToAdministrationUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notifyPortalRecipientForStaffMessage).mockResolvedValue(undefined);
  });

  it("returns error when parent has no linked students", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageToAdministrationUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_INVALID_RECIPIENT });
  });

  it("returns error when no admins exist", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    } as never);

    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [{ student_id: "s1" }], error: null }),
      })),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageToAdministrationUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_NO_ADMINS });
  });

  it("returns ok and notifies admins when linked and admins exist", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [{ id: "a1", role: "admin" }],
          error: null,
        }),
      })),
    } as never);

    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ student_id: "s1" }], error: null }),
          };
        }
        if (table === "portal_messages") {
          return { insert };
        }
        throw new Error(`unexpected ${table}`);
      }),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageToAdministrationUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      bodyHtml: "<p>hi</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalled();
    expect(notifyPortalRecipientForStaffMessage).toHaveBeenCalled();
  });
});
