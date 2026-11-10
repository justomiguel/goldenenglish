/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { decodePngRgba } from "@/lib/brand/scalePng";
import { readInstallIconSource } from "@/lib/brand/readInstallIconSource";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
}));

describe("readInstallIconSource", () => {
  it("reads the Matiss logo PNG from public", async () => {
    const bytes = await readInstallIconSource({
      logoPath: "/images/matiss/logo/logo.png",
      faviconPath: "/images/matiss/logo/logo.png",
    });
    expect(decodePngRgba(bytes ?? new Uint8Array())?.width).toBe(512);
  });

  it("skips a path that leaves the public folder", async () => {
    const bytes = await readInstallIconSource({
      logoPath: "/../package.json",
      faviconPath: "/no-such-icon.svg",
    });
    expect(bytes).toBeNull();
  });

  it("uses a remote PNG when the logo is an absolute URL", async () => {
    const png = await readInstallIconSource({
      logoPath: "/images/matiss/logo/logo.png",
      faviconPath: "/images/matiss/logo/logo.png",
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(png, { status: 200 }),
    );
    const bytes = await readInstallIconSource({
      logoPath: "https://cdn.example/logo.png",
      faviconPath: "https://cdn.example/favicon.ico",
    });
    expect(decodePngRgba(bytes ?? new Uint8Array())?.width).toBe(512);
    fetchMock.mockRestore();
  });
});
