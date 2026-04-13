import { describe, expect, it } from "vitest";
import {
  PROFILE_AVATAR_MAX_BYTES,
  fillProfileAvatarMaxMbTemplate,
  profileAvatarMaxSizeMb,
} from "@/lib/profile/avatarUploadLimits";

describe("avatarUploadLimits", () => {
  it("exposes 15 MB ceiling aligned with product copy", () => {
    expect(profileAvatarMaxSizeMb()).toBe(15);
    expect(PROFILE_AVATAR_MAX_BYTES).toBe(15 * 1024 * 1024);
  });

  it("fills {max} in dictionary templates", () => {
    expect(fillProfileAvatarMaxMbTemplate("Max {max} MB.")).toBe("Max 15 MB.");
    expect(fillProfileAvatarMaxMbTemplate("{max}{max}")).toBe("1515");
  });
});
