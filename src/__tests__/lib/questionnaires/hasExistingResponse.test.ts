import { describe, expect, it } from "vitest";
import { hasExistingResponse } from "@/lib/questionnaires/hasExistingResponse";

describe("hasExistingResponse", () => {
  const rows = [
    { respondentUserId: "u1", respondentEmail: null },
    { respondentUserId: null, respondentEmail: "a@b.com" },
  ];

  it("matches logged-in user id", () => {
    expect(hasExistingResponse(rows, { userId: "u1", email: null })).toBe(true);
    expect(hasExistingResponse(rows, { userId: "u2", email: null })).toBe(false);
  });

  it("matches normalized email when there is no user", () => {
    expect(hasExistingResponse(rows, { userId: null, email: "A@B.com" })).toBe(true);
    expect(hasExistingResponse(rows, { userId: null, email: "other@b.com" })).toBe(false);
  });
});
