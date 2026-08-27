import { describe, expect, it, vi } from "vitest";
import {
  clearSectionReferenceImage,
  persistSectionReferenceImage,
} from "@/lib/register/persistSectionReferenceImage";

function adminMock(opts?: {
  uploadError?: boolean;
  updateError?: boolean;
}) {
  const upload = vi.fn().mockResolvedValue({ error: opts?.uploadError ? { message: "up" } : null });
  const remove = vi.fn().mockResolvedValue({ error: null });
  const eq = vi.fn().mockResolvedValue({ error: opts?.updateError ? { message: "upd" } : null });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  return {
    client: {
      storage: { from: vi.fn().mockReturnValue({ upload, remove }) },
      from,
    },
    upload,
    remove,
    update,
  };
}

describe("persistSectionReferenceImage", () => {
  it("rejects a disallowed mime without writing", async () => {
    const { client, upload } = adminMock();
    const result = await persistSectionReferenceImage({
      admin: client,
      sectionId: "11111111-1111-4111-8111-111111111111",
      bytes: new Uint8Array([1, 2, 3]),
      mime: "image/svg+xml",
    });
    expect(result).toEqual({ ok: false });
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads then updates the column and removes the previous object", async () => {
    const { client, upload, remove, update } = adminMock();
    const result = await persistSectionReferenceImage({
      admin: client,
      sectionId: "11111111-1111-4111-8111-111111111111",
      bytes: new Uint8Array([1, 2, 3]),
      mime: "image/jpeg",
      previousPath: "old/a.jpg",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.path).toMatch(/^11111111-1111-4111-8111-111111111111\/\d+\.jpg$/);
    }
    expect(upload).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({ reference_image_path: expect.stringContaining(".jpg") });
    expect(remove).toHaveBeenCalledWith(["old/a.jpg"]);
  });

  it("clears the column and deletes the stored object", async () => {
    const { client, remove, update } = adminMock();
    const result = await clearSectionReferenceImage({
      admin: client,
      sectionId: "11111111-1111-4111-8111-111111111111",
      previousPath: "sec/1.jpg",
    });
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ reference_image_path: null });
    expect(remove).toHaveBeenCalledWith(["sec/1.jpg"]);
  });
});
