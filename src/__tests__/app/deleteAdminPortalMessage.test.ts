import { describe, expect, it, vi } from "vitest";
import { deleteAdminPortalMessage } from "@/app/[locale]/dashboard/admin/messages/actions";

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

describe("deleteAdminPortalMessage", () => {
  it("rejects invalid uuid", async () => {
    const r = await deleteAdminPortalMessage("es", "not-a-uuid");
    expect(r).toEqual({ ok: false, code: "invalid_id" });
  });

  it("deletes when admin session and row removed", async () => {
    vi.mocked(resolveIsAdminSession).mockResolvedValueOnce(true);

    const selectResolved = vi.fn().mockResolvedValue({
      data: [{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      error: null,
    });

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "portal_messages") {
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: selectResolved,
            }),
          }),
        };
      }
      return {};
    });

    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from,
    } as never);

    const r = await deleteAdminPortalMessage("es", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(r).toEqual({ ok: true });
    expect(selectResolved).toHaveBeenCalledWith("id");
  });
});
