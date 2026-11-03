import { describe, expect, it } from "vitest";
import {
  FREE_CONTACT_MAIL_QUOTA,
  releaseFreeContactCount,
  reserveFreeContactCount,
} from "@/lib/pulsar/freeContactMailQuota";

describe("freeContactMailQuota", () => {
  it("stops at 50 and lets a failed send return the count", () => {
    expect(FREE_CONTACT_MAIL_QUOTA).toBe(50);
    expect(reserveFreeContactCount(49, 50)).toEqual({ status: "reserved", sent: 50 });
    expect(reserveFreeContactCount(50, 50)).toEqual({ status: "quota", sent: 50 });
    expect(releaseFreeContactCount(50)).toBe(49);
    expect(releaseFreeContactCount(0)).toBe(0);
  });
});
