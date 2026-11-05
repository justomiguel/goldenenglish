import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadFileToSignedUrlWithProgress = vi.fn();

vi.mock("@/lib/client/uploadFileToSignedUrlWithProgress", () => ({
  uploadFileToSignedUrlWithProgress: (...args: unknown[]) => uploadFileToSignedUrlWithProgress(...args),
}));

vi.mock("@/lib/supabase/publicEnv", () => ({
  readSupabasePublicEnv: () => ({ url: "https://db.example", anonKey: "anon" }),
}));

vi.mock("@/lib/logging/clientLog", () => ({
  logClientWarn: vi.fn(),
}));

import { uploadEventRegistrationFile } from "@/lib/client/uploadEventRegistrationFile";

function file() {
  return new File([new Uint8Array([1, 2, 3])], "pago.jpg", { type: "image/jpeg" });
}

describe("uploadEventRegistrationFile", () => {
  beforeEach(() => {
    uploadFileToSignedUrlWithProgress.mockReset();
    uploadFileToSignedUrlWithProgress.mockResolvedValue(undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, path: "event/staging/k/receipt/pago.jpg", token: "tok" }),
      })),
    );
  });

  it("asks for a signed URL and uploads the file outside the app server", async () => {
    const result = await uploadEventRegistrationFile({
      slug: "gala",
      locale: "es",
      email: "ana@example.com",
      dniOrPassport: "1",
      file: file(),
      kind: "receipt",
    });
    expect(result).toEqual({ ok: true, path: "event/staging/k/receipt/pago.jpg" });
    expect(uploadFileToSignedUrlWithProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        supabaseUrl: "https://db.example",
        token: "tok",
        storagePath: "event/staging/k/receipt/pago.jpg",
      }),
    );
    const init = (fetch as unknown as { mock: { calls: Array<[string, { body: string }]> } }).mock
      .calls[0]?.[1];
    const body = JSON.parse(init?.body ?? "{}") as { byteSize: number; kind: string };
    expect(body.byteSize).toBe(3);
    expect(body.kind).toBe("receipt");
  });

  it("returns the platform status when the sign request is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 413,
        json: async () => null,
      })),
    );
    const result = await uploadEventRegistrationFile({
      slug: "gala",
      locale: "es",
      email: "ana@example.com",
      dniOrPassport: "1",
      file: file(),
      kind: "receipt",
    });
    expect(result).toEqual({ ok: false, code: "http_413" });
    expect(uploadFileToSignedUrlWithProgress).not.toHaveBeenCalled();
  });
});
