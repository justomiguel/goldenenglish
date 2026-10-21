import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { performEventMediaFileUpload } from "@/components/dashboard/admin/events/performEventMediaFileUpload";

const prepareEventMediaFileUploadAction = vi.fn();
const uploadFileToSignedUrlWithProgress = vi.fn();

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  prepareEventMediaFileUploadAction: (...args: unknown[]) =>
    prepareEventMediaFileUploadAction(...args),
}));

vi.mock("@/lib/client/uploadFileToSignedUrlWithProgress", () => ({
  uploadFileToSignedUrlWithProgress: (...args: unknown[]) =>
    uploadFileToSignedUrlWithProgress(...args),
}));

vi.mock("@/lib/supabase/publicEnv", () => ({
  readSupabasePublicEnv: () => ({ url: "https://proj.supabase.co", anonKey: "anon" }),
}));

describe("performEventMediaFileUpload", () => {
  beforeEach(() => {
    prepareEventMediaFileUploadAction.mockReset();
    uploadFileToSignedUrlWithProgress.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("reports preparing, then byte percent, then the storage path", async () => {
    const phases: string[] = [];
    prepareEventMediaFileUploadAction.mockResolvedValue({
      ok: true,
      storagePath: "events/evt/cover.jpg",
      token: "tok",
    });
    uploadFileToSignedUrlWithProgress.mockImplementation(
      async (input: { onProgress?: (n: number) => void }) => {
        input.onProgress?.(40);
      },
    );

    const file = new File([new Uint8Array(4)], "cover.jpg", { type: "image/jpeg" });
    const result = await performEventMediaFileUpload(file, "evt-1", (progress) => {
      phases.push(
        progress.phase === "uploading" && progress.percent !== null
          ? `${progress.phase}:${progress.percent}`
          : progress.phase,
      );
    });

    expect(result).toEqual({ storagePath: "events/evt/cover.jpg" });
    expect(prepareEventMediaFileUploadAction).toHaveBeenCalledWith({
      filename: "cover.jpg",
      contentType: "image/jpeg",
      byteSize: 4,
      eventId: "evt-1",
    });
    expect(uploadFileToSignedUrlWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        supabaseUrl: "https://proj.supabase.co",
        bucket: "event-media",
        storagePath: "events/evt/cover.jpg",
        token: "tok",
        file,
      }),
    );
    expect(phases).toEqual(["preparing", "uploading:0", "uploading:40"]);
  });

  it("returns null when prepare fails and does not upload", async () => {
    prepareEventMediaFileUploadAction.mockResolvedValue({ ok: false, code: "forbidden" });
    const result = await performEventMediaFileUpload(
      new File([new Uint8Array(4)], "cover.jpg", { type: "image/jpeg" }),
    );
    expect(result).toBeNull();
    expect(uploadFileToSignedUrlWithProgress).not.toHaveBeenCalled();
  });
});
