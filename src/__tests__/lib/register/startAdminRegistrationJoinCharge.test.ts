/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { trialConvertInviteIsLive } from "@/lib/register/trialConvertInviteIsLive";

describe("trialConvertInviteIsLive", () => {
  it("is true only when the convert token is still in date", () => {
    expect(
      trialConvertInviteIsLive({
        trialConvertToken: "tok",
        trialConvertExpiresAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe(true);
    expect(
      trialConvertInviteIsLive({
        trialConvertToken: "tok",
        trialConvertExpiresAt: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).toBe(false);
    expect(trialConvertInviteIsLive({ trialConvertToken: null })).toBe(false);
  });
});
