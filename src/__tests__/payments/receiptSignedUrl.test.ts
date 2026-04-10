import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSigned = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mockSigned,
      })),
    },
  })),
}));

import { receiptSignedUrlForAdmin } from "@/lib/payments/receiptSignedUrl";

describe("receiptSignedUrlForAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for empty path", async () => {
    await expect(receiptSignedUrlForAdmin(null)).resolves.toBeNull();
  });

  it("returns null for path traversal", async () => {
    await expect(receiptSignedUrlForAdmin("u/../secret")).resolves.toBeNull();
  });

  it("returns null when storage returns error", async () => {
    mockSigned.mockResolvedValue({ data: null, error: { message: "nope" } });
    await expect(receiptSignedUrlForAdmin("ok.png")).resolves.toBeNull();
  });

  it("returns null when signedUrl missing", async () => {
    mockSigned.mockResolvedValue({ data: {}, error: null });
    await expect(receiptSignedUrlForAdmin("ok.png")).resolves.toBeNull();
  });

  it("returns signed url", async () => {
    mockSigned.mockResolvedValue({
      data: { signedUrl: "https://example.com/x" },
      error: null,
    });
    await expect(receiptSignedUrlForAdmin("u/1.png")).resolves.toBe(
      "https://example.com/x",
    );
  });
});
