/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  isRecipientAllowedForAdmin,
  isRecipientAllowedForTeacher,
} from "@/lib/messaging/messagingRecipientRules";

describe("messagingRecipientRules", () => {
  it("teacher may message portal roles except unknown", () => {
    expect(isRecipientAllowedForTeacher("student")).toBe(true);
    expect(isRecipientAllowedForTeacher("parent")).toBe(true);
    expect(isRecipientAllowedForTeacher("teacher")).toBe(true);
    expect(isRecipientAllowedForTeacher("admin")).toBe(true);
    expect(isRecipientAllowedForTeacher("staff")).toBe(false);
    expect(isRecipientAllowedForTeacher(undefined)).toBe(false);
  });

  it("admin may message same set but not self", () => {
    expect(isRecipientAllowedForAdmin("student", "a1", "s1")).toBe(true);
    expect(isRecipientAllowedForAdmin("parent", "a1", "p1")).toBe(true);
    expect(isRecipientAllowedForAdmin("teacher", "a1", "t1")).toBe(true);
    expect(isRecipientAllowedForAdmin("admin", "a1", "a2")).toBe(true);
    expect(isRecipientAllowedForAdmin("admin", "a1", "a1")).toBe(false);
  });
});
