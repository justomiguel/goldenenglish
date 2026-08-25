import { afterEach, describe, expect, it } from "vitest";
import { signViewAsCookie, verifyViewAsCookie } from "@/lib/dashboard/viewAsCookie";

describe("viewAsCookie", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  it("signs and verifies a subject id", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const token = signViewAsCookie("user-1", 1_700_000_000);
    expect(token).toBeTruthy();
    expect(verifyViewAsCookie(token)).toEqual({ userId: "user-1", iat: 1_700_000_000 });
  });

  it("returns null when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    expect(signViewAsCookie("user-1")).toBeNull();
    expect(verifyViewAsCookie("anything")).toBeNull();
  });

  it("rejects a tampered token", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const token = signViewAsCookie("user-1", 1_700_000_000);
    expect(verifyViewAsCookie(`${token}x`)).toBeNull();
  });
});
