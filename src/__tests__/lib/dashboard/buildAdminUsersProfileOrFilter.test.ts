// REGRESSION CHECK: Admin users list server search must include DNI, email id resolution,
// tutor/parent tokens, and UUID — tutors are profiles with role parent.

import { describe, expect, it } from "vitest";
import {
  buildAdminUsersProfileOrFilter,
  looksLikeFullEmailQuery,
  looksLikeUuidQuery,
  parentRoleSearchTokenMatches,
} from "@/lib/dashboard/buildAdminUsersProfileOrFilter";

describe("parentRoleSearchTokenMatches", () => {
  it("matches single tutor-related tokens only", () => {
    expect(parentRoleSearchTokenMatches("tutor")).toBe(true);
    expect(parentRoleSearchTokenMatches("padres")).toBe(true);
    expect(parentRoleSearchTokenMatches("TUTOR")).toBe(true);
    expect(parentRoleSearchTokenMatches("  tutor  ")).toBe(true);
    expect(parentRoleSearchTokenMatches("tutor maría")).toBe(false);
    expect(parentRoleSearchTokenMatches("")).toBe(false);
  });
});

describe("looksLikeFullEmailQuery", () => {
  it("accepts simple emails only", () => {
    expect(looksLikeFullEmailQuery("a@b.co")).toBe(true);
    expect(looksLikeFullEmailQuery("  Foo@Example.COM ")).toBe(true);
    expect(looksLikeFullEmailQuery("partial@")).toBe(false);
    expect(looksLikeFullEmailQuery("no-at-sign")).toBe(false);
  });
});

describe("looksLikeUuidQuery", () => {
  it("detects uuid v4-shaped ids", () => {
    expect(
      looksLikeUuidQuery("550e8400-e29b-41d4-a716-446655440000"),
    ).toBe(true);
    expect(looksLikeUuidQuery("not-a-uuid")).toBe(false);
  });
});

describe("buildAdminUsersProfileOrFilter", () => {
  it("includes ilike fields and optional fragments", () => {
    const uid = "550e8400-e29b-41d4-a716-446655440000";
    const f = buildAdminUsersProfileOrFilter("María", uid);
    expect(f).toContain("first_name.ilike.%María%");
    expect(f).toContain("last_name.ilike.%María%");
    expect(f).toContain("phone.ilike.%María%");
    expect(f).toContain("dni_or_passport.ilike.%María%");
    expect(f).toContain(`id.eq.${uid}`);
  });

  it("escapes % and _ in ilike pattern", () => {
    const f = buildAdminUsersProfileOrFilter("100%_done", null);
    expect(f).toContain("first_name.ilike.%100\\%\\_done%");
  });

  it("adds role.eq.parent for tutor token", () => {
    const f = buildAdminUsersProfileOrFilter("tutor", null);
    expect(f).toContain("role.eq.parent");
  });

  it("adds id.eq for uuid-shaped query", () => {
    const id = "aaaaaaaa-bbbb-4ccc-8eee-eeeeeeeeeeee";
    const f = buildAdminUsersProfileOrFilter(id, null);
    expect(f).toContain(`id.eq.${id}`);
  });
});
