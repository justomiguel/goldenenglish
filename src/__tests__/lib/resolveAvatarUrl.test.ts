import { describe, it, expect, vi } from "vitest";
import {
  resolveAvatarDisplayUrl,
  resolveAvatarUrlForAdmin,
} from "@/lib/dashboard/resolveAvatarUrl";

describe("resolveAvatarDisplayUrl / resolveAvatarUrlForAdmin", () => {
  it("returns https URLs unchanged", async () => {
    const admin = {} as never;
    expect(await resolveAvatarDisplayUrl(admin, "https://x.example/a.png")).toBe(
      "https://x.example/a.png",
    );
    expect(await resolveAvatarUrlForAdmin(admin, "https://x.example/a.png")).toBe(
      "https://x.example/a.png",
    );
  });

  it("returns null for empty", async () => {
    const admin = {} as never;
    expect(await resolveAvatarDisplayUrl(admin, null)).toBe(null);
    expect(await resolveAvatarDisplayUrl(admin, "   ")).toBe(null);
  });

  it("returns null for path traversal", async () => {
    const admin = {} as never;
    expect(await resolveAvatarDisplayUrl(admin, "../evil")).toBe(null);
  });

  it("creates signed URL for storage path", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://proj.supabase.co/storage/v1/object/sign/avatars/u/a.png?token=x" },
      error: null,
    });
    const admin = {
      storage: {
        from: () => ({ createSignedUrl }),
      },
    } as never;
    const out = await resolveAvatarDisplayUrl(admin, "u/a.png");
    expect(createSignedUrl).toHaveBeenCalledWith("u/a.png", 60 * 60);
    expect(out).toContain("sign");
  });
});
