/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSignedUploadUrl, event } = vi.hoisted(() => ({
  createSignedUploadUrl: vi.fn(),
  event: {
    id: "event-1",
    fields: [
      {
        id: "field-1",
        fieldKey: "photo",
        fieldType: "image" as const,
        labelI18n: { es: "Foto" },
        required: false,
      },
    ],
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({
    storage: { from: () => ({ createSignedUploadUrl }) },
  }),
}));

vi.mock("@/lib/events/server/openPublishedEvent", () => ({
  openPublishedEvent: async () => ({
    event,
    client: {
      storage: { from: () => ({ createSignedUploadUrl }) },
    },
    entryHostSlug: null,
  }),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { prepareEventRegistrationUpload } from "@/lib/events/server/prepareEventRegistrationUpload";

const base = {
  slug: "gala",
  locale: "es",
  email: "ana@example.com",
  dniOrPassport: "123",
  fileName: "pago.jpg",
  mimeType: "image/jpeg",
  byteSize: 1200,
};

describe("prepareEventRegistrationUpload", () => {
  beforeEach(() => {
    createSignedUploadUrl.mockReset();
    createSignedUploadUrl.mockResolvedValue({ data: { token: "tok" }, error: null });
  });

  it("signs a receipt path and does not receive the file bytes", async () => {
    const result = await prepareEventRegistrationUpload({ ...base, kind: "receipt" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token).toBe("tok");
    expect(result.path).toContain("/staging/");
    expect(result.path).toContain("/receipt/");
    expect(createSignedUploadUrl).toHaveBeenCalledWith(result.path);
  });

  it("rejects a receipt above 15 MB before signing", async () => {
    const result = await prepareEventRegistrationUpload({
      ...base,
      kind: "receipt",
      byteSize: 16 * 1024 * 1024,
    });
    expect(result).toEqual({ ok: false, code: "invalid_file" });
    expect(createSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("rejects an unknown custom field", async () => {
    const result = await prepareEventRegistrationUpload({
      ...base,
      kind: "field",
      fieldId: "missing",
    });
    expect(result).toEqual({ ok: false, code: "field_not_found" });
  });
});
