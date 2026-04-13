import { describe, expect, it, vi } from "vitest";
import { requestUserFacingVideoStream } from "@/lib/client/requestUserFacingVideoStream";

describe("requestUserFacingVideoStream", () => {
  it("rejects when getUserMedia is missing", async () => {
    const prev = navigator.mediaDevices;
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: undefined });
    await expect(requestUserFacingVideoStream()).rejects.toThrow("no-getUserMedia");
    vi.stubGlobal("navigator", { ...navigator, mediaDevices: prev });
  });

  it("falls back to generic video when ideal facing fails", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const ideal = vi.fn().mockRejectedValueOnce(new Error("overconstrained"));
    const plain = vi.fn().mockResolvedValueOnce(stream);
    const getUserMedia = vi.fn((c: MediaStreamConstraints) =>
      c.video && typeof c.video === "object" && "facingMode" in c.video ? ideal(c) : plain(c),
    );
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia },
    });
    await expect(requestUserFacingVideoStream()).resolves.toBe(stream);
    expect(ideal).toHaveBeenCalledTimes(1);
    expect(plain).toHaveBeenCalledTimes(1);
  });
});
