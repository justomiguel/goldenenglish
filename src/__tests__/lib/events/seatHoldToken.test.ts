import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { hashSeatHoldToken } from "@/lib/events/seatHoldToken";

describe("hashSeatHoldToken", () => {
  it("hashes a uuid and rejects anything else", () => {
    const token = "11111111-1111-4111-8111-111111111111";
    expect(hashSeatHoldToken(token)).toBe(createHash("sha256").update(token).digest("hex"));
    expect(hashSeatHoldToken("short")).toBeNull();
    expect(hashSeatHoldToken(null)).toBeNull();
  });
});
