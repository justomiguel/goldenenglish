import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/dashboard/assertAdmin", () => ({ assertAdmin: vi.fn() }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(() =>
    Promise.resolve({
      admin: {
        finance: {
          collections: {
            bulkScholarship: {
              resultOk: "{count} succeeded",
              resultPartial: "{ok} ok, {failed} failed",
              resultError: "error",
            },
          },
        },
      },
    }),
  ),
}));

import { runBulkSectionScholarshipAction } from "@/app/[locale]/dashboard/admin/finance/collections/[sectionId]/runBulkSectionScholarshipAction";

describe("runBulkSectionScholarshipAction validation", () => {
  it("rejects invalid month range (from > to)", async () => {
    const result = await runBulkSectionScholarshipAction({
      locale: "en",
      sectionId: "11111111-1111-1111-1111-111111111111",
      year: 2026,
      discountPercent: 20,
      scope: "all",
      fromMonth: 6,
      toMonth: 3,
    });

    expect(result.ok).toBe(false);
  });

  it("rejects discount percent over 100", async () => {
    const result = await runBulkSectionScholarshipAction({
      locale: "en",
      sectionId: "11111111-1111-1111-1111-111111111111",
      year: 2026,
      discountPercent: 150,
      scope: "all",
      fromMonth: 1,
      toMonth: 12,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Invalid input");
  });

  it("rejects discount percent under 1", async () => {
    const result = await runBulkSectionScholarshipAction({
      locale: "en",
      sectionId: "11111111-1111-1111-1111-111111111111",
      year: 2026,
      discountPercent: 0,
      scope: "all",
      fromMonth: 1,
      toMonth: 12,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Invalid input");
  });

  it("rejects invalid sectionId", async () => {
    const result = await runBulkSectionScholarshipAction({
      locale: "en",
      sectionId: "not-a-uuid",
      year: 2026,
      discountPercent: 20,
      scope: "all",
      fromMonth: 1,
      toMonth: 6,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Invalid input");
  });
});
