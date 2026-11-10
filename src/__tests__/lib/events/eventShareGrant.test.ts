import { describe, expect, it } from "vitest";
import {
  decideReview,
  decideShareRequest,
  decideUnshareRequest,
} from "@/lib/events/eventShareGrant";

// REGRESSION CHECK: Open grants are pending, approved, and pending_unshare.
// A rejected or closed row must not block a new share request.

const enabled = ["liora", "matiss", "nago"] as const;

describe("decideShareRequest", () => {
  it("rejects the owner site", () => {
    expect(
      decideShareRequest({
        ownerSlug: "liora",
        guestSlug: "liora",
        enabledSlugs: enabled,
        openStatus: null,
      }),
    ).toEqual({ ok: false, code: "share_self" });
  });

  it("rejects an unknown or disabled site", () => {
    expect(
      decideShareRequest({
        ownerSlug: "liora",
        guestSlug: "missing",
        enabledSlugs: enabled,
        openStatus: null,
      }),
    ).toEqual({ ok: false, code: "share_target_unknown" });
  });

  it("rejects a second open grant", () => {
    for (const openStatus of ["pending", "approved", "pending_unshare"] as const) {
      expect(
        decideShareRequest({
          ownerSlug: "liora",
          guestSlug: "matiss",
          enabledSlugs: enabled,
          openStatus,
        }),
      ).toEqual({ ok: false, code: "share_already_open" });
    }
  });

  it("allows a new request after a closed or rejected grant", () => {
    expect(
      decideShareRequest({
        ownerSlug: "liora",
        guestSlug: "matiss",
        enabledSlugs: enabled,
        openStatus: null,
      }),
    ).toEqual({ ok: true });
  });
});

describe("decideUnshareRequest", () => {
  it("moves only an approved grant to pending unshare", () => {
    expect(decideUnshareRequest("approved")).toEqual({ ok: true });
    expect(decideUnshareRequest("pending")).toEqual({ ok: false, code: "share_not_approved" });
    expect(decideUnshareRequest(null)).toEqual({ ok: false, code: "share_not_approved" });
  });
});

describe("decideReview", () => {
  it("approves a share and rejects it", () => {
    expect(decideReview({ status: "pending", decision: "approve" })).toEqual({
      ok: true,
      next: "approved",
    });
    expect(decideReview({ status: "pending", decision: "reject" })).toEqual({
      ok: true,
      next: "rejected",
    });
  });

  it("closes on unshare approval and restores the share on rejection", () => {
    expect(decideReview({ status: "pending_unshare", decision: "approve" })).toEqual({
      ok: true,
      next: "closed",
    });
    expect(decideReview({ status: "pending_unshare", decision: "reject" })).toEqual({
      ok: true,
      next: "approved",
    });
  });

  it("refuses a review of a finished grant", () => {
    expect(decideReview({ status: "approved", decision: "approve" })).toEqual({
      ok: false,
      code: "share_not_approved",
    });
    expect(decideReview({ status: "closed", decision: "reject" })).toEqual({
      ok: false,
      code: "share_not_approved",
    });
  });
});
