/** @vitest-environment node */
import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { studentReceiptSignedUrl } from "@/lib/payments/studentReceiptSignedUrl";

describe("studentReceiptSignedUrl", () => {
  it("returns null for empty path", async () => {
    const supabase = {} as SupabaseClient;
    await expect(studentReceiptSignedUrl(supabase, "u1", null)).resolves.toBeNull();
    await expect(studentReceiptSignedUrl(supabase, "u1", "   ")).resolves.toBeNull();
  });

  it("returns null for path traversal", async () => {
    const supabase = {} as SupabaseClient;
    await expect(studentReceiptSignedUrl(supabase, "u1", "u1/../evil")).resolves.toBeNull();
  });

  it("returns null when path does not start with user prefix", async () => {
    const supabase = {} as SupabaseClient;
    await expect(studentReceiptSignedUrl(supabase, "u1", "other/x.pdf")).resolves.toBeNull();
  });

  it("returns signed URL on success", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://signed" },
      error: null,
    });
    const supabase = {
      storage: {
        from: vi.fn(() => ({ createSignedUrl })),
      },
    } as unknown as SupabaseClient;
    await expect(studentReceiptSignedUrl(supabase, "u1", "u1/pay.pdf")).resolves.toBe(
      "https://signed",
    );
    expect(createSignedUrl).toHaveBeenCalledWith("u1/pay.pdf", 300);
  });

  it("returns null on storage error", async () => {
    const supabase = {
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: "x" } }),
        })),
      },
    } as unknown as SupabaseClient;
    await expect(studentReceiptSignedUrl(supabase, "u1", "u1/p.pdf")).resolves.toBeNull();
  });
});
