/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, anonClient } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  anonClient: vi.fn(),
}));

vi.mock("@/lib/supabase/anon", () => ({
  createAnonReadOnlyClient: () => anonClient(),
}));

import { loadPublicBadgeCatalogEntryByCode } from "@/lib/badges/loadPublicBadgeCatalogEntry";

beforeEach(() => {
  rpcMock.mockReset();
  anonClient.mockReset();
  anonClient.mockReturnValue({ rpc: rpcMock });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadPublicBadgeCatalogEntryByCode", () => {
  it("returns null for empty / oversized codes without hitting Supabase", async () => {
    expect(await loadPublicBadgeCatalogEntryByCode("")).toBeNull();
    expect(await loadPublicBadgeCatalogEntryByCode("x".repeat(65))).toBeNull();
    expect(anonClient).not.toHaveBeenCalled();
  });

  it("returns null when public env is unavailable", async () => {
    anonClient.mockReturnValueOnce(null);
    expect(await loadPublicBadgeCatalogEntryByCode("ok")).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns null when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    expect(await loadPublicBadgeCatalogEntryByCode("ok")).toBeNull();
  });

  it("decodes a single-row result with translations", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          badge_id: "id-1",
          code: "ok",
          category: "tasks",
          image_path: "x/y.png",
          translations: {
            en: { title: "Hi", description: "There" },
            es: { title: "Hola", description: "Mundo" },
            fr: { title: "Bonjour", description: "ignored" },
          },
        },
      ],
      error: null,
    });
    const out = await loadPublicBadgeCatalogEntryByCode("ok");
    expect(out).toEqual({
      badgeId: "id-1",
      code: "ok",
      category: "tasks",
      imagePath: "x/y.png",
      translations: {
        en: { title: "Hi", description: "There" },
        es: { title: "Hola", description: "Mundo" },
      },
    });
  });

  it("returns null when category is unknown", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { badge_id: "id-1", code: "ok", category: "ghost", image_path: null, translations: {} },
      error: null,
    });
    expect(await loadPublicBadgeCatalogEntryByCode("ok")).toBeNull();
  });

  it("normalises empty image_path to null", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { badge_id: "id-1", code: "ok", category: "tasks", image_path: "", translations: {} },
      error: null,
    });
    const out = await loadPublicBadgeCatalogEntryByCode("ok");
    expect(out?.imagePath).toBeNull();
  });
});
