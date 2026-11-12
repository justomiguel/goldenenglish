import { describe, expect, it, vi } from "vitest";
import { loadVariantFleetCounts } from "@/lib/theme-document/server/loadVariantFleetCounts";

describe("loadVariantFleetCounts", () => {
  it("groups pin rows by variant and major across pages", async () => {
    const range = vi
      .fn()
      .mockResolvedValueOnce({
        data: [
          { variant_id: "hero.bleed", major: 1 },
          { variant_id: "hero.bleed", major: 1 },
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ variant_id: "band.paper", major: 1 }],
        error: null,
      });
    const client = {
      from: () => ({
        select: () => ({ range }),
      }),
    };
    const counts = await loadVariantFleetCounts(client, 2);
    expect(counts).toEqual({ "hero.bleed@1": 2, "band.paper@1": 1 });
    expect(range).toHaveBeenCalledWith(0, 1);
    expect(range).toHaveBeenCalledWith(2, 3);
  });
});
