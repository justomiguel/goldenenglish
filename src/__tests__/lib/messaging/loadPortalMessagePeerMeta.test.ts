/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPortalMessagePeerMeta } from "@/lib/messaging/loadPortalMessagePeerMeta";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("loadPortalMessagePeerMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty list when there are no peer ids", async () => {
    const rows = await loadPortalMessagePeerMeta([]);
    expect(rows).toEqual([]);
  });

  it("returns the role and surname-first name for hidden peers", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: "a1", first_name: "Luis", last_name: "Paz", role: "admin" }],
            error: null,
          }),
        }),
      })),
    } as never);

    const rows = await loadPortalMessagePeerMeta(["a1", "a1"]);
    expect(rows).toEqual([{ id: "a1", name: "Paz Luis", role: "admin" }]);
  });
});
