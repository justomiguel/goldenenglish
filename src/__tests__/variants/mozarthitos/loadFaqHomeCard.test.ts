import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logServerWarn: vi.fn(),
  logServerActionInvariantViolation: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { loadMozarthitosFaqHomeCard } from "@/variants/owned/mozarthitos/pieces/loadFaqHomeCard";

const items = [{ id: "price", q: "How much?" }];

describe("loadMozarthitosFaqHomeCard", () => {
  const readStats = vi.fn();

  beforeEach(() => {
    readStats.mockReset();
  });

  it("returns no card for another theme and does not read stats", async () => {
    await expect(loadMozarthitosFaqHomeCard("classic", readStats, items)).resolves.toBeNull();
    expect(readStats).not.toHaveBeenCalled();
  });

  it("maps the 30-day rows for Mozarthitos", async () => {
    readStats.mockResolvedValue({
      data: { visits: 2, opens: [{ questionId: "price", count: 1 }] },
      error: null,
    });
    await expect(loadMozarthitosFaqHomeCard("mozarthitos", readStats, items)).resolves.toEqual({
      ok: true,
      visits: 2,
      rows: [{ id: "price", question: "How much?", opens: 1 }],
    });
  });

  it("returns load_failed when the read errors and stats_unavailable when the payload is empty", async () => {
    readStats.mockResolvedValue({ data: null, error: { message: "down", code: "XX" } });
    await expect(loadMozarthitosFaqHomeCard("mozarthitos", readStats, items)).resolves.toEqual({
      ok: false,
      code: "load_failed",
    });

    readStats.mockResolvedValue({ data: null, error: null });
    await expect(loadMozarthitosFaqHomeCard("mozarthitos", readStats, items)).resolves.toEqual({
      ok: false,
      code: "stats_unavailable",
    });
  });
});
