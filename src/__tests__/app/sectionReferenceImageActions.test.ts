/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAssertAdmin, createAdminClient, persist, clear } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  createAdminClient: vi.fn(),
  persist: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/register/persistSectionReferenceImage", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/register/persistSectionReferenceImage")
  >("@/lib/register/persistSectionReferenceImage");
  return {
    ...actual,
    persistSectionReferenceImage: (...args: unknown[]) => persist(...args),
    clearSectionReferenceImage: (...args: unknown[]) => clear(...args),
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  removeSectionReferenceImageAction,
  uploadSectionReferenceImageAction,
} from "@/app/[locale]/dashboard/admin/academic/sectionReferenceImageActions";

const SECTION = "11111111-1111-4111-8111-111111111111";
const JPEG = Buffer.from([0xff, 0xd8, 0xff]).toString("base64");

describe("sectionReferenceImageActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    persist.mockResolvedValue({ ok: true, path: "sec/1.jpg" });
    clear.mockResolvedValue({ ok: true });
    createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: SECTION,
                cohort_id: "22222222-2222-4222-8222-222222222222",
                reference_image_path: "old.jpg",
              },
              error: null,
            }),
          }),
        }),
      }),
    });
  });

  it("returns ok false when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("forbidden"));
    await expect(
      uploadSectionReferenceImageAction({
        locale: "es",
        sectionId: SECTION,
        imageBase64: JPEG,
        imageMime: "image/jpeg",
      }),
    ).resolves.toEqual({ ok: false });
    expect(persist).not.toHaveBeenCalled();
  });

  it("uploads after loading the previous path", async () => {
    await expect(
      uploadSectionReferenceImageAction({
        locale: "es",
        sectionId: SECTION,
        imageBase64: JPEG,
        imageMime: "image/jpeg",
      }),
    ).resolves.toEqual({ ok: true });
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        sectionId: SECTION,
        mime: "image/jpeg",
        previousPath: "old.jpg",
      }),
    );
  });

  it("removes the stored photo", async () => {
    await expect(
      removeSectionReferenceImageAction({ locale: "es", sectionId: SECTION }),
    ).resolves.toEqual({ ok: true });
    expect(clear).toHaveBeenCalledWith(
      expect.objectContaining({ sectionId: SECTION, previousPath: "old.jpg" }),
    );
  });
});
