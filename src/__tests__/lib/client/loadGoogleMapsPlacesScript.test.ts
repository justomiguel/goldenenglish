import { afterEach, describe, expect, it, vi } from "vitest";

describe("loadGoogleMapsPlacesScript", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as unknown as { google?: unknown }).google;
    vi.restoreAllMocks();
  });

  it("rejects on SSR (no window)", async () => {
    vi.stubGlobal("window", undefined);
    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    await expect(loadGoogleMapsPlacesScript("k")).rejects.toMatchObject({ message: "maps_script_ssr" });
    vi.resetModules();
  });

  it("resolves when importLibrary is already present", async () => {
    vi.resetModules();
    (window as unknown as { google: unknown }).google = { maps: { importLibrary: vi.fn() } };
    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    await expect(loadGoogleMapsPlacesScript("k")).resolves.toBeUndefined();
  });

  it("resolves when places legacy hook exists", async () => {
    vi.resetModules();
    (window as unknown as { google: unknown }).google = { maps: { places: {} } };
    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    await expect(loadGoogleMapsPlacesScript("k")).resolves.toBeUndefined();
  });

  it("rejects when api key missing", async () => {
    vi.resetModules();
    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    await expect(loadGoogleMapsPlacesScript("")).rejects.toMatchObject({ message: "maps_script_no_key" });
  });

  it("injects script once, resolves on load, second call reuses promise", async () => {
    vi.resetModules();
    const appendChild = vi.fn();
    const head = { appendChild };
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      expect(tag).toBe("script");
      const el = {
        async: false,
        src: "",
        onload: null as null | (() => void),
        onerror: null as null | (() => void),
      };
      return el as unknown as HTMLScriptElement;
    });
    vi.spyOn(document, "head", "get").mockReturnValue(head as unknown as HTMLHeadElement);

    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    const p1 = loadGoogleMapsPlacesScript("abc");
    const p2 = loadGoogleMapsPlacesScript("ignored");
    expect(p1).toBe(p2);
    const el = appendChild.mock.calls[0]![0] as unknown as { onload: (() => void) | null };
    el.onload!();
    await expect(p1).resolves.toBeUndefined();
  });

  it("rejects when script onerror", async () => {
    vi.resetModules();
    const appendChild = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation(() => {
      const el = {
        async: false,
        src: "",
        onload: null as null | (() => void),
        onerror: null as null | (() => void),
      };
      return el as unknown as HTMLScriptElement;
    });
    vi.spyOn(document, "head", "get").mockReturnValue({ appendChild } as unknown as HTMLHeadElement);

    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    const p = loadGoogleMapsPlacesScript("k");
    const el = appendChild.mock.calls[0]![0] as unknown as { onerror: (() => void) | null };
    el.onerror!();
    await expect(p).rejects.toMatchObject({ message: "maps_script_error" });
  });

  it("resolves when marker library already present", async () => {
    vi.resetModules();
    (window as unknown as { google: unknown }).google = { maps: { marker: {} } };
    const { loadGoogleMapsPlacesScript } = await import("@/lib/client/loadGoogleMapsPlacesScript");
    await expect(loadGoogleMapsPlacesScript("k")).resolves.toBeUndefined();
  });
});
