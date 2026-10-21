import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { performGlobalMaterialFileUpload } from "@/components/admin/performGlobalMaterialFileUpload";

const prepareGlobalContentFileUploadAction = vi.fn();
const uploadFileToSignedUrlWithProgress = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/globalContentFormDataActions", () => ({
  prepareGlobalContentFileUploadAction: (...args: unknown[]) =>
    prepareGlobalContentFileUploadAction(...args),
}));

vi.mock("@/lib/client/uploadFileToSignedUrlWithProgress", () => ({
  uploadFileToSignedUrlWithProgress: (...args: unknown[]) =>
    uploadFileToSignedUrlWithProgress(...args),
}));

vi.mock("@/lib/supabase/publicEnv", () => ({
  readSupabasePublicEnv: () => ({ url: "https://proj.supabase.co", anonKey: "anon" }),
}));

describe("performGlobalMaterialFileUpload", () => {
  beforeEach(() => {
    prepareGlobalContentFileUploadAction.mockReset();
    uploadFileToSignedUrlWithProgress.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports preparing, then byte percent, then the asset ref", async () => {
    const phases: string[] = [];
    prepareGlobalContentFileUploadAction.mockResolvedValue({
      ok: true,
      assetId: "asset-1",
      storagePath: "templates/admin/asset/intro.mp4",
      token: "tok",
    });
    uploadFileToSignedUrlWithProgress.mockImplementation(
      async (input: { onProgress?: (n: number) => void }) => {
        input.onProgress?.(70);
      },
    );

    const file = new File([new Uint8Array(5)], "intro.mp4", { type: "video/mp4" });
    const result = await performGlobalMaterialFileUpload(file, (progress) => {
      phases.push(
        progress.phase === "uploading" && progress.percent !== null
          ? `${progress.phase}:${progress.percent}`
          : progress.phase,
      );
    });

    expect(result).toEqual({
      assetId: "asset-1",
      storagePath: "templates/admin/asset/intro.mp4",
    });
    expect(uploadFileToSignedUrlWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: "learning-task-assets",
        storagePath: "templates/admin/asset/intro.mp4",
        token: "tok",
        file,
      }),
    );
    expect(phases).toEqual(["preparing", "uploading:0", "uploading:70"]);
  });
});
