import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { performBlogMediaFileUpload } from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";

const uploadFileToSignedUrlWithProgress = vi.fn();
const fetchMock = vi.fn();

vi.mock("@/lib/client/uploadFileToSignedUrlWithProgress", () => ({
  uploadFileToSignedUrlWithProgress: (...args: unknown[]) =>
    uploadFileToSignedUrlWithProgress(...args),
}));

vi.mock("@/lib/supabase/publicEnv", () => ({
  readSupabasePublicEnv: () => ({ url: "https://proj.supabase.co", anonKey: "anon" }),
}));

describe("performBlogMediaFileUpload", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    uploadFileToSignedUrlWithProgress.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prepares via the signed-upload API then uploads with progress phases", async () => {
    const phases: string[] = [];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, storagePath: "drafts/a.jpg", token: "tok" }),
    });
    uploadFileToSignedUrlWithProgress.mockImplementation(
      async (input: { onProgress?: (n: number) => void }) => {
        input.onProgress?.(55);
      },
    );

    const file = new File([new Uint8Array(4)], "a.jpg", { type: "image/jpeg" });
    const result = await performBlogMediaFileUpload(file, "art-1", (progress) => {
      phases.push(
        progress.phase === "uploading" && progress.percent !== null
          ? `${progress.phase}:${progress.percent}`
          : progress.phase,
      );
    });

    expect(result).toEqual({ storagePath: "drafts/a.jpg" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/blog/media-signed-upload",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          filename: "a.jpg",
          contentType: "image/jpeg",
          byteSize: 4,
          articleId: "art-1",
        }),
      }),
    );
    expect(uploadFileToSignedUrlWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        supabaseUrl: "https://proj.supabase.co",
        bucket: "blog-media",
        storagePath: "drafts/a.jpg",
        token: "tok",
        file,
      }),
    );
    expect(phases).toEqual(["preparing", "uploading:0", "uploading:55"]);
  });

  it("returns null when prepare fails and does not upload", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, code: "forbidden" }),
    });
    const result = await performBlogMediaFileUpload(
      new File([new Uint8Array(4)], "a.jpg", { type: "image/jpeg" }),
    );
    expect(result).toBeNull();
    expect(uploadFileToSignedUrlWithProgress).not.toHaveBeenCalled();
  });
});
