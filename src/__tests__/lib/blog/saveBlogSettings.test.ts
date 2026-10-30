import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();
const recordSystemAudit = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => recordSystemAudit(...args),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { saveBlogSettings } from "@/lib/blog/server/saveBlogSettings";

function supabase() {
  return {
    from(table: string) {
      if (table !== "site_settings") throw new Error(table);
      return { upsert };
    },
  };
}

const input = {
  actorId: "actor-1",
  blogEnabled: true,
  commentsEnabled: false,
  guestCommentsEnabled: true,
  locale: "es",
};

describe("saveBlogSettings", () => {
  beforeEach(() => {
    upsert.mockReset();
    recordSystemAudit.mockReset();
    upsert.mockResolvedValue({ error: null });
    recordSystemAudit.mockResolvedValue({ ok: true });
  });

  it("does not update when the actor cannot configure", async () => {
    const result = await saveBlogSettings(supabase() as never, {
      ...input,
      canConfigure: false,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
    expect(upsert).not.toHaveBeenCalled();
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("audits the three booleans on success", async () => {
    const result = await saveBlogSettings(supabase() as never, {
      ...input,
      canConfigure: true,
    });
    expect(result).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledTimes(1);
    const rows = upsert.mock.calls[0]?.[0] as Array<{ key: string; value: boolean }>;
    expect(rows.map((row) => row.key)).toEqual([
      "blog_enabled",
      "blog_comments_enabled",
      "blog_guest_comments_enabled",
    ]);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceType: "site_settings",
        payload: {
          blog_enabled: true,
          blog_comments_enabled: false,
          blog_guest_comments_enabled: true,
        },
      }),
    );
  });
});
