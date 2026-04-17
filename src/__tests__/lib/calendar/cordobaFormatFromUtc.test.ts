import { describe, expect, it } from "vitest";
import { cordobaHmFromUtcMs, cordobaIsoDateFromUtcMs } from "@/lib/calendar/cordobaFormatFromUtc";

describe("cordobaFormatFromUtc", () => {
  it("maps noon UTC to 09:00 Cordoba on 2025-04-16", () => {
    const ms = Date.UTC(2025, 3, 16, 12, 0, 0);
    expect(cordobaIsoDateFromUtcMs(ms)).toBe("2025-04-16");
    expect(cordobaHmFromUtcMs(ms)).toBe("09:00");
  });
});
