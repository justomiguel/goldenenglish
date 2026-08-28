/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertBlogAuthor, prepareBlogMediaFileUpload } = vi.hoisted(() => ({
  assertBlogAuthor: vi.fn(),
  prepareBlogMediaFileUpload: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertBlogAuthor", () => ({ assertBlogAuthor }));
vi.mock("@/lib/blog/server/prepareBlogMediaFileUpload", () => ({
  prepareBlogMediaFileUpload,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
}));

import { POST } from "@/app/api/blog/media-signed-upload/route";
import { ADMIN_SESSION_UNAUTHORIZED } from "@/lib/dashboard/adminSessionErrors";

describe("POST /api/blog/media-signed-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertBlogAuthor.mockResolvedValue({
      supabase: { storage: {} },
      user: { id: "user-1" },
    });
  });

  it("returns a signed upload token for an author", async () => {
    prepareBlogMediaFileUpload.mockResolvedValue({
      ok: true,
      storagePath: "drafts/a.mp4",
      token: "tok",
    });
    const res = await POST(
      new Request("http://localhost/api/blog/media-signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: "a.mp4",
          contentType: "video/mp4",
          byteSize: 12,
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      storagePath: "drafts/a.mp4",
      token: "tok",
    });
    expect(prepareBlogMediaFileUpload).toHaveBeenCalledWith(
      { storage: {} },
      "user-1",
      expect.objectContaining({ filename: "a.mp4" }),
    );
  });

  it("returns 401 when the session is missing", async () => {
    assertBlogAuthor.mockRejectedValue(new Error(ADMIN_SESSION_UNAUTHORIZED));
    const res = await POST(
      new Request("http://localhost/api/blog/media-signed-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
    expect(prepareBlogMediaFileUpload).not.toHaveBeenCalled();
  });
});
