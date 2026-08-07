import { describe, expect, it, vi } from "vitest";
import {
  bulkDeleteAdminPortalMessages,
  bulkSetAdminPortalMessageReadState,
} from "@/app/[locale]/dashboard/admin/messages/bulkActions";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: vi.fn(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";

const ID_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ID_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("bulkSetAdminPortalMessageReadState", () => {
  it("rejects empty list", async () => {
    const r = await bulkSetAdminPortalMessageReadState("es", [], false);
    expect(r).toEqual({ ok: false, code: "empty" });
  });

  it("marks many as read when admin", async () => {
    vi.mocked(resolveIsAdminSession).mockResolvedValueOnce(true);
    const inFn = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ in: inFn });
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({ update }),
    } as never);

    const r = await bulkSetAdminPortalMessageReadState("es", [ID_A, ID_B], false);
    expect(r).toEqual({ ok: true, count: 2 });
    expect(inFn).toHaveBeenCalledWith("id", [ID_A, ID_B]);
  });
});

describe("bulkDeleteAdminPortalMessages", () => {
  it("rejects invalid ids", async () => {
    const r = await bulkDeleteAdminPortalMessages("es", [ID_A, "bad"]);
    expect(r).toEqual({ ok: false, code: "invalid_id" });
  });

  it("deletes when admin and rows removed", async () => {
    vi.mocked(resolveIsAdminSession).mockResolvedValueOnce(true);
    const select = vi.fn().mockResolvedValue({
      data: [{ id: ID_A }, { id: ID_B }],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({ select }),
        }),
      }),
    } as never);

    const r = await bulkDeleteAdminPortalMessages("es", [ID_A, ID_B]);
    expect(r).toEqual({ ok: true, count: 2 });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portal_messages_bulk_deleted",
        payload: expect.objectContaining({ count: 2 }),
      }),
    );
  });
});
