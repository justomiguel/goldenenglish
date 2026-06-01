import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  optimizeImageBufferForShare,
  SHARE_OG_HEIGHT,
  SHARE_OG_WIDTH,
} from "@/lib/rich-content/optimizeRemoteImageForShare";

describe("optimizeImageBufferForShare", () => {
  it("returns a JPEG under the default byte budget for a large PNG source", async () => {
    const source = await sharp({
      create: {
        width: 1034,
        height: 887,
        channels: 3,
        noise: { type: "gaussian", mean: 128, sigma: 30 },
      },
    })
      .png()
      .toBuffer();

    expect(source.byteLength).toBeGreaterThan(500_000);

    const optimized = await optimizeImageBufferForShare(source);

    expect(optimized.contentType).toBe("image/jpeg");
    expect(optimized.width).toBe(SHARE_OG_WIDTH);
    expect(optimized.height).toBe(SHARE_OG_HEIGHT);
    expect(optimized.buffer.byteLength).toBeLessThanOrEqual(280_000);
    expect(optimized.buffer.subarray(0, 2).toString("hex")).toBe("ffd8");
  });

  it("lowers JPEG quality when maxBytes is tighter than the default budget", async () => {
    const source = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        noise: { type: "gaussian", mean: 64, sigma: 40 },
      },
    })
      .png()
      .toBuffer();

    const defaultBudget = await optimizeImageBufferForShare(source);
    const tightBudget = await optimizeImageBufferForShare(source, { maxBytes: 120_000 });

    expect(tightBudget.buffer.byteLength).toBeLessThanOrEqual(120_000);
    expect(tightBudget.buffer.byteLength).toBeLessThan(defaultBudget.buffer.byteLength);
  });
});
