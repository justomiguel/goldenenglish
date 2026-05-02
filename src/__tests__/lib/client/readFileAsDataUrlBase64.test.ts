import { describe, it, expect, vi } from "vitest";
import { readFileAsDataUrlBase64 } from "@/lib/client/readFileAsDataUrlBase64";

describe("readFileAsDataUrlBase64", () => {
  it("resolves raw base64 without data-URL prefix and preserves file.type as mime", async () => {
    const bytes = new Uint8Array([72, 105]);
    const file = new File([bytes], "note.txt", { type: "text/plain" });
    const { base64, mime } = await readFileAsDataUrlBase64(file);
    expect(mime).toBe("text/plain");
    expect(base64).not.toContain("data:");
    expect(Buffer.from(base64, "base64").toString("utf8")).toBe("Hi");
  });

  it("calls onProgress with 1 when load completes", async () => {
    const onProgress = vi.fn();
    const file = new File(["x"], "a.txt", { type: "text/plain" });
    await readFileAsDataUrlBase64(file, { onProgress });
    expect(onProgress).toHaveBeenCalledWith(1);
  });
});
