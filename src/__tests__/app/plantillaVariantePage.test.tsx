import { afterEach, describe, expect, it, vi } from "vitest";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mockNotFound }));

import Page, { metadata } from "@/app/[locale]/plantilla/variante/[id]/[major]/page";

const previous = process.env.GE_DEV_TARGET;

afterEach(() => {
  mockNotFound.mockClear();
  if (previous === undefined) delete process.env.GE_DEV_TARGET;
  else process.env.GE_DEV_TARGET = previous;
});

function call(id: string, major: string, fixture?: string) {
  return Page({
    params: Promise.resolve({ locale: "es", id, major }),
    searchParams: Promise.resolve(fixture === undefined ? {} : { fixture }),
  });
}

describe("plantilla variante preview", () => {
  it("stays out of the index", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("returns 404 when the dev target is unset", async () => {
    delete process.env.GE_DEV_TARGET;
    await expect(call("hero.bleed", "1")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns 404 when the dev target is production", async () => {
    process.env.GE_DEV_TARGET = "production";
    await expect(call("hero.bleed", "1")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns 404 for an unknown variant", async () => {
    process.env.GE_DEV_TARGET = "local";
    await expect(call("hero.missing", "1")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders a known variant on the local target", async () => {
    process.env.GE_DEV_TARGET = "local";
    await expect(call("hero.bleed", "1", "0")).resolves.toBeTruthy();
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});
