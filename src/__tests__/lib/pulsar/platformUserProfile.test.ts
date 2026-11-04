import { describe, expect, it } from "vitest";
import { decodeProfilePhoto, parseProfileDisplayName } from "@/lib/pulsar/platformUserProfile";

describe("parseProfileDisplayName", () => {
  it("keeps a trimmed name and rejects an empty or long one", () => {
    expect(parseProfileDisplayName("  Ana  ")).toEqual({ ok: true, name: "Ana" });
    expect(parseProfileDisplayName("  ")).toEqual({ ok: false });
    expect(parseProfileDisplayName("a".repeat(81))).toEqual({ ok: false });
  });
});

describe("decodeProfilePhoto", () => {
  it("accepts a small jpeg and rejects other types", () => {
    const bytes = Buffer.from("hello-photo");
    const decoded = decodeProfilePhoto(bytes.toString("base64"), "image/jpeg");
    expect(decoded.ok).toBe(true);
    expect(decodeProfilePhoto(bytes.toString("base64"), "image/gif").ok).toBe(false);
  });
});