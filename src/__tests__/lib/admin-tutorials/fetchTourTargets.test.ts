import { describe, expect, it, vi, afterEach } from "vitest";
import {
  fetchAttendanceTarget,
  fetchEventTarget,
  fetchScholarshipTarget,
} from "@/lib/admin-tutorials/client/fetchTourTargets";

describe("fetchTourTargets", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns attendance JSON on ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cohortId: "c1", sectionId: "s1" }),
      }),
    );
    await expect(fetchAttendanceTarget()).resolves.toEqual({
      cohortId: "c1",
      sectionId: "s1",
    });
  });

  it("returns null when scholarship fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(fetchScholarshipTarget()).resolves.toBeNull();
  });

  it("returns event id JSON on ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ eventId: "ev1" }),
      }),
    );
    await expect(fetchEventTarget()).resolves.toEqual({ eventId: "ev1" });
  });
});
