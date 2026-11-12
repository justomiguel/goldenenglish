import { afterEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const { mockNotFound, mockVerify, mockTenant } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockVerify: vi.fn(),
  mockTenant: vi.fn(),
}));

vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("@/lib/theme-document/previewToken", () => ({
  previewSigningKeyFromEnv: vi.fn(async () => ({}) as CryptoKey),
  verifyPreviewToken: mockVerify,
  verifyPreviewTokenAtRequest: mockVerify,
}));
vi.mock("@/lib/tenant/alsTenantAccessor", () => ({
  getAlsTenant: mockTenant,
}));

import Page, { metadata } from "@/app/[locale]/plantilla/borrador/page";
import { PreviewSurfaceProvider } from "@/hooks/useAppSurface";
import { applyDraftPreviewCache } from "@/lib/theme-document/draftPreviewCache";

afterEach(() => {
  mockNotFound.mockClear();
  mockVerify.mockReset();
  mockTenant.mockReset();
});

function call(token?: string, surface?: string) {
  return Page({
    params: Promise.resolve({ locale: "es" }),
    searchParams: Promise.resolve({
      ...(token ? { token } : {}),
      ...(surface ? { surface } : {}),
    }),
  });
}

describe("plantilla borrador preview", () => {
  it("stays out of the index", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("returns 404 for a bad token", async () => {
    mockVerify.mockResolvedValue({ ok: false, code: "preview_token_invalid" });
    mockTenant.mockReturnValue({ slug: "golden" });
    await expect(call("bad")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns 404 when the token tenant does not match the host", async () => {
    mockVerify.mockResolvedValue({ ok: true, tenantSlug: "a", draftId: "draft-1" });
    mockTenant.mockReturnValue({ slug: "b" });
    await expect(call("signed")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets a private no-store cache header on this path", () => {
    const response = NextResponse.next();
    applyDraftPreviewCache("/es/plantilla/borrador", response);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const other = NextResponse.next();
    applyDraftPreviewCache("/es/blog", other);
    expect(other.headers.get("Cache-Control")).toBeNull();
  });

  it("passes the pwa surface override to the surface provider", async () => {
    mockVerify.mockResolvedValue({ ok: true, tenantSlug: "golden", draftId: "draft-1" });
    mockTenant.mockReturnValue({ slug: "golden" });
    const view = await call("signed", "pwa-mobile");
    expect(view.type).toBe(PreviewSurfaceProvider);
    expect(view.props.surface).toBe("pwa-mobile");
  });
});
