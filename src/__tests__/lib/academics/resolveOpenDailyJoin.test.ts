import { describe, expect, it } from "vitest";
import { resolveOpenDailyJoin } from "@/lib/academics/resolveOpenDailyJoin";

// REGRESSION CHECK: Join href is built only for an Ecosistema hybrid/remote
// section with credentials, a room row, and an open window. No token is issued.
// openClass.startIso must be the institute-timezone wall clock, not the
// server process timezone.

const mondaySlot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };
const insideMonday = new Date("2026-11-02T21:00:00.000Z");

describe("resolveOpenDailyJoin", () => {
  it("builds the student class href for an open Ecosistema window", () => {
    const offer = resolveOpenDailyJoin({
      now: insideMonday,
      timeZone: "America/Argentina/Cordoba",
      plan: "ecosistema",
      credentialsReady: true,
      role: "student",
      locale: "es",
      persona: "student",
      candidates: [
        {
          sectionId: "sec-1",
          label: "A1 — Morning",
          teacher: "García Ana",
          mode: "remote",
          slots: [mondaySlot],
          rooms: [{ dayOfWeek: 1, startTime: "18:00" }],
        },
      ],
    });

    expect(offer?.joinHref).toBe(
      "/es/dashboard/student/sections/sec-1/class?day=1&start=18:00",
    );
    expect(offer?.openClass.label).toBe("A1 — Morning");
  });

  it("builds openClass.startIso in the institute timezone", () => {
    const offer = resolveOpenDailyJoin({
      now: new Date("2026-11-02T20:45:00.000Z"),
      timeZone: "America/Argentina/Cordoba",
      plan: "ecosistema",
      credentialsReady: true,
      role: "student",
      locale: "es",
      persona: "student",
      candidates: [
        {
          sectionId: "sec-1",
          label: "A1 — Morning",
          teacher: "García Ana",
          mode: "remote",
          slots: [mondaySlot],
          rooms: [{ dayOfWeek: 1, startTime: "18:00" }],
        },
      ],
    });

    expect(offer?.openClass.startIso).toBe("2026-11-02T21:00:00.000Z");
    expect(offer?.openClass.startIso).not.toBe("2026-11-02T18:00:00.000Z");
  });

  it("returns null when the plan is not ecosistema", () => {
    const offer = resolveOpenDailyJoin({
      now: insideMonday,
      timeZone: "America/Argentina/Cordoba",
      plan: "gestion",
      credentialsReady: true,
      role: "teacher",
      locale: "es",
      persona: "teacher",
      candidates: [
        {
          sectionId: "sec-1",
          label: "A1 — Morning",
          teacher: "",
          mode: "hybrid",
          slots: [mondaySlot],
          rooms: [{ dayOfWeek: 1, startTime: "18:00" }],
        },
      ],
    });

    expect(offer).toBeNull();
  });
});
