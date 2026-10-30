import { describe, expect, it } from "vitest";
import { encodeRgbaPng } from "@/lib/brand/encodePng";
import { letterMarkPng } from "@/lib/brand/letterMarkPng";
import { decodePngRgba, scalePngNearest } from "@/lib/brand/scalePng";
import { attachVercelProjectDomain, detachVercelProjectDomain } from "@/lib/pulsar/attachVercelDomain";

describe("png scale and letter mark", () => {
  it("round-trips a plain PNG and scales it", () => {
    const source = encodeRgbaPng(2, 2, new Uint8Array([
      10, 20, 30, 255, 40, 50, 60, 255,
      70, 80, 90, 255, 1, 2, 3, 255,
    ]));
    const decoded = decodePngRgba(source);
    expect(decoded?.width).toBe(2);
    expect(decoded?.rgba[0]).toBe(10);
    const scaled = scalePngNearest(source, 4, 4);
    const out = scaled ? decodePngRgba(scaled) : null;
    expect(out?.width).toBe(4);
    expect(out?.height).toBe(4);
  });

  it("draws a letter mark as a PNG", () => {
    const png = letterMarkPng({
      name: "Norte",
      size: 32,
      ink: [20, 40, 30],
      paper: [245, 240, 230],
    });
    expect(png[0]).toBe(137);
    const decoded = decodePngRgba(png);
    expect(decoded?.width).toBe(32);
  });
});

describe("attachVercelProjectDomain", () => {
  it("treats 201 and 409 as success", async () => {
    const fetchImpl = async () => new Response("{}", { status: 201 });
    const created = await attachVercelProjectDomain({
      token: "t",
      projectId: "p",
      domain: "club.example.com",
      fetchImpl,
    });
    const exists = await attachVercelProjectDomain({
      token: "t",
      projectId: "p",
      domain: "club.example.com",
      fetchImpl: async () => new Response("{}", { status: 409 }),
    });
    expect(created.ok).toBe(true);
    expect(exists.ok).toBe(true);
  });

  it("treats a missing Vercel domain as removed", async () => {
    const gone = await detachVercelProjectDomain({
      token: "t",
      projectId: "p",
      domain: "old.example.com",
      fetchImpl: async () => new Response("{}", { status: 404 }),
    });
    expect(gone.ok).toBe(true);
  });
});
