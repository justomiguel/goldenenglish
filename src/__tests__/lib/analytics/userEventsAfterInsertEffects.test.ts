/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  parentLastSessionBackfillAt,
  userEventsAfterInsertEffects,
} from "@/lib/analytics/userEventsAfterInsertEffects";

// REGRESSION CHECK: Changing the student-only gate in user_events_after_insert
// may hide parent last access on /admin/parents (last_session_start_at stays null).

const NONE = {
  stampLastSessionStartAt: false,
  clearChurnNotifiedAt: false,
  awardMaterialEngagement: false,
};

describe("userEventsAfterInsertEffects", () => {
  it("stamps last access for a parent session_start without student side effects", () => {
    expect(
      userEventsAfterInsertEffects({
        role: "parent",
        eventType: "session_start",
        entity: "session:start",
      }),
    ).toEqual({
      stampLastSessionStartAt: true,
      clearChurnNotifiedAt: false,
      awardMaterialEngagement: false,
    });
  });

  it("stamps last access and clears churn for a student session_start", () => {
    expect(
      userEventsAfterInsertEffects({
        role: "student",
        eventType: "session_start",
        entity: "session:start",
      }),
    ).toEqual({
      stampLastSessionStartAt: true,
      clearChurnNotifiedAt: true,
      awardMaterialEngagement: false,
    });
  });

  it("awards engagement only for student material page views", () => {
    expect(
      userEventsAfterInsertEffects({
        role: "student",
        eventType: "page_view",
        entity: "material:abc",
      }),
    ).toEqual({
      stampLastSessionStartAt: false,
      clearChurnNotifiedAt: false,
      awardMaterialEngagement: true,
    });
    expect(
      userEventsAfterInsertEffects({
        role: "parent",
        eventType: "page_view",
        entity: "material:abc",
      }),
    ).toEqual(NONE);
  });

  it("stamps last access for staff session_start without student side effects", () => {
    expect(
      userEventsAfterInsertEffects({
        role: "teacher",
        eventType: "session_start",
        entity: "session:start",
      }),
    ).toEqual({
      stampLastSessionStartAt: true,
      clearChurnNotifiedAt: false,
      awardMaterialEngagement: false,
    });
  });

  it("does nothing when the profile has no role", () => {
    expect(
      userEventsAfterInsertEffects({
        role: null,
        eventType: "session_start",
        entity: "session:start",
      }),
    ).toEqual(NONE);
  });
});

describe("parentLastSessionBackfillAt", () => {
  it("prefers the latest session_start over any other event", () => {
    expect(
      parentLastSessionBackfillAt({
        current: null,
        latestSessionStartAt: "2026-08-20T12:00:00.000Z",
        latestAnyEventAt: "2026-08-28T12:00:00.000Z",
      }),
    ).toBe("2026-08-20T12:00:00.000Z");
  });

  it("falls back to any user_event when there is no session_start", () => {
    expect(
      parentLastSessionBackfillAt({
        current: null,
        latestSessionStartAt: null,
        latestAnyEventAt: "2026-08-10T08:00:00.000Z",
      }),
    ).toBe("2026-08-10T08:00:00.000Z");
  });

  it("keeps the current value when there are no events", () => {
    expect(
      parentLastSessionBackfillAt({
        current: null,
        latestSessionStartAt: null,
        latestAnyEventAt: null,
      }),
    ).toBeNull();
  });

  it("does not overwrite a newer current last access", () => {
    expect(
      parentLastSessionBackfillAt({
        current: "2026-08-28T00:00:00.000Z",
        latestSessionStartAt: "2026-08-01T00:00:00.000Z",
        latestAnyEventAt: "2026-08-01T00:00:00.000Z",
      }),
    ).toBe("2026-08-28T00:00:00.000Z");
  });
});
