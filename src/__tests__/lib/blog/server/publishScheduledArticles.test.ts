import { describe, expect, it, vi } from "vitest";
import { publishScheduledArticles } from "@/lib/blog/server/publishScheduledArticles";

describe("publishScheduledArticles", () => {
  it("returns published count from update query", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: "a" }, { id: "b" }], error: null });
    const lte = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ lte });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as Parameters<typeof publishScheduledArticles>[0];

    const result = await publishScheduledArticles(supabase);
    expect(result).toEqual({ ok: true, publishedCount: 2 });
  });

  it("returns ok false when update fails", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const lte = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ lte });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as Parameters<typeof publishScheduledArticles>[0];

    const result = await publishScheduledArticles(supabase);
    expect(result).toEqual({ ok: false, publishedCount: 0 });
  });

  it("treats null data as zero published", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: null });
    const lte = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ lte });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as Parameters<typeof publishScheduledArticles>[0];

    const result = await publishScheduledArticles(supabase);
    expect(result).toEqual({ ok: true, publishedCount: 0 });
  });
});
