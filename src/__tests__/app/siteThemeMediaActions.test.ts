/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteSiteThemeMediaAction,
  uploadSiteThemeMediaAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeMediaActions";

const {
  mockAssertAdmin,
  recordSystemAudit,
  revalidatePath,
  updateTag,
} = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
  updateTag,
}));

const VALID_ID = "00000000-0000-4000-8000-000000000222";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("uploadSiteThemeMediaAction", () => {
  it("rejects unauthorized callers", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await uploadSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      section: "inicio",
      position: 1,
      contentType: "image/png",
      fileName: "x.png",
      fileBase64: "QUJD",
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects invalid Zod payloads", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await uploadSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      section: "inicio",
      position: 99,
      contentType: "image/png",
      fileName: "x.png",
      fileBase64: "QUJD",
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("rejects unsupported MIME types early", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await uploadSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      section: "inicio",
      position: 1,
      contentType: "image/gif",
      fileName: "x.gif",
      fileBase64: "QUJD",
    });
    expect(result).toEqual({ ok: false, code: "media_mime_invalid" });
  });

  it("rejects files larger than the cap", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const big = Buffer.alloc(5 * 1024 * 1024).toString("base64");
    const result = await uploadSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      section: "inicio",
      position: 1,
      contentType: "image/png",
      fileName: "x.png",
      fileBase64: big,
    });
    expect(result).toEqual({ ok: false, code: "media_too_large" });
  });
});

describe("deleteSiteThemeMediaAction", () => {
  it("rejects when admin guard throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await deleteSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      mediaId: VALID_ID,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects invalid media uuid", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await deleteSiteThemeMediaAction({
      locale: "en",
      id: VALID_ID,
      mediaId: "not-a-uuid",
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });
});
