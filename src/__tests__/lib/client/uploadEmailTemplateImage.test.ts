/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prepareEventMediaFileUploadAction, uploadFileToSignedUrlWithProgress } = vi.hoisted(() => ({
  prepareEventMediaFileUploadAction: vi.fn(),
  uploadFileToSignedUrlWithProgress: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventAttendeeActions", () => ({
  prepareEventMediaFileUploadAction: (...args: unknown[]) => prepareEventMediaFileUploadAction(...args),
}));

vi.mock("@/lib/client/uploadFileToSignedUrlWithProgress", () => ({
  uploadFileToSignedUrlWithProgress: (...args: unknown[]) => uploadFileToSignedUrlWithProgress(...args),
}));

import { EMAIL_IMAGE_MAX_BYTES, uploadEmailTemplateImage } from "@/lib/client/uploadEmailTemplateImage";

function imageFile(type = "image/png", size = 12) {
  return new File([new Uint8Array(size)], "Foto aula.png", { type });
}

describe("uploadEmailTemplateImage", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
    prepareEventMediaFileUploadAction.mockReset();
    prepareEventMediaFileUploadAction.mockResolvedValue({
      ok: true,
      storagePath: "drafts/admin/photo.png",
      token: "tok",
    });
    uploadFileToSignedUrlWithProgress.mockReset();
    uploadFileToSignedUrlWithProgress.mockImplementation(
      async (input: { onProgress?: (value: number) => void }) => {
        input.onProgress?.(40);
        input.onProgress?.(100);
      },
    );
  });

  it("uploads a png and returns an https image tag", async () => {
    const phases: string[] = [];
    const html = await uploadEmailTemplateImage({
      file: imageFile(),
      onProgress: (phase, value) => phases.push(value === undefined ? phase : `${phase}:${value}`),
    });
    expect(html).toContain(
      'src="https://proj.supabase.co/storage/v1/object/public/event-media/drafts/admin/photo.png"',
    );
    expect(html).toContain('alt="Foto aula"');
    expect(phases).toEqual(["preparing", "sending:40", "sending:100"]);
    expect(prepareEventMediaFileUploadAction).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "image/png", byteSize: 12 }),
    );
  });

  it("refuses a video file and a file over 4 MB before uploading", async () => {
    await expect(
      uploadEmailTemplateImage({ file: imageFile("video/mp4") }),
    ).resolves.toBeNull();
    await expect(
      uploadEmailTemplateImage({ file: imageFile("image/png", EMAIL_IMAGE_MAX_BYTES + 1) }),
    ).resolves.toBeNull();
    expect(prepareEventMediaFileUploadAction).not.toHaveBeenCalled();
  });

  it("returns null when the upload fails", async () => {
    uploadFileToSignedUrlWithProgress.mockRejectedValue(new Error("down"));
    await expect(uploadEmailTemplateImage({ file: imageFile() })).resolves.toBeNull();
  });
});
