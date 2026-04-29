/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, createAnonReadOnlyClient } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  createAnonReadOnlyClient: vi.fn(),
}));

vi.mock("@/lib/supabase/anon", () => ({
  createAnonReadOnlyClient: () => createAnonReadOnlyClient(),
}));

import { loadPublicStudentBadgeShareByToken } from "@/lib/badges/loadPublicStudentBadgeShare";

const VALID_TOKEN = "11111111-2222-4333-8444-555555555555";

beforeEach(() => {
  rpcMock.mockReset();
  createAnonReadOnlyClient.mockReset();
  createAnonReadOnlyClient.mockReturnValue({ rpc: rpcMock });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadPublicStudentBadgeShareByToken", () => {
  it("returns null for malformed UUID without hitting Supabase", async () => {
    const out = await loadPublicStudentBadgeShareByToken("not-a-uuid");
    expect(out).toBeNull();
    expect(createAnonReadOnlyClient).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns null when public Supabase env is unavailable", async () => {
    createAnonReadOnlyClient.mockReturnValueOnce(null);
    const out = await loadPublicStudentBadgeShareByToken(VALID_TOKEN);
    expect(out).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("returns null when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const out = await loadPublicStudentBadgeShareByToken(VALID_TOKEN);
    expect(out).toBeNull();
    expect(rpcMock).toHaveBeenCalledWith("get_public_student_badge_share", {
      p_token: VALID_TOKEN,
    });
  });

  it("returns null when the RPC returns no row", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    expect(await loadPublicStudentBadgeShareByToken(VALID_TOKEN)).toBeNull();
  });

  it("returns null when the badge_code shape is invalid", async () => {
    // Uppercase + spaces violate the catalog code shape (lowercase + _ only).
    rpcMock.mockResolvedValueOnce({
      data: [{ badge_code: "Ghost Badge!", earned_at: "2026-04-01T10:00:00Z" }],
      error: null,
    });
    expect(await loadPublicStudentBadgeShareByToken(VALID_TOKEN)).toBeNull();
  });

  it("accepts catalog-shaped codes that are not in the seed list (admin-created)", async () => {
    // Catalog codes are dynamic now; the loader only validates shape.
    rpcMock.mockResolvedValueOnce({
      data: [{ badge_code: "custom_admin_badge", earned_at: "2026-04-01T10:00:00Z" }],
      error: null,
    });
    expect(await loadPublicStudentBadgeShareByToken(VALID_TOKEN)).toEqual({
      badgeCode: "custom_admin_badge",
      earnedAt: "2026-04-01T10:00:00Z",
    });
  });

  it("decodes a valid grant from an array result", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        { badge_code: "tasks_completed_1", earned_at: "2026-04-01T10:00:00Z" },
      ],
      error: null,
    });
    const out = await loadPublicStudentBadgeShareByToken(VALID_TOKEN);
    expect(out).toEqual({
      badgeCode: "tasks_completed_1",
      earnedAt: "2026-04-01T10:00:00Z",
    });
  });

  it("decodes a valid grant from a single-object result", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { badge_code: "profile_complete", earned_at: "2026-03-15T12:00:00Z" },
      error: null,
    });
    const out = await loadPublicStudentBadgeShareByToken(VALID_TOKEN);
    expect(out).toEqual({
      badgeCode: "profile_complete",
      earnedAt: "2026-03-15T12:00:00Z",
    });
  });
});
