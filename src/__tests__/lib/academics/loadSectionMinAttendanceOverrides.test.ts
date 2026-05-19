import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadSectionMinAttendanceOverrides } from "@/lib/academics/loadSectionMinAttendanceOverrides";

describe("loadSectionMinAttendanceOverrides", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns overrides keyed by section id", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(async () => ({
            data: [
              { id: "sec-a", min_attendance_percent: 90 },
              { id: "sec-b", min_attendance_percent: null },
            ],
            error: null,
          })),
        })),
      })),
    };

    const map = await loadSectionMinAttendanceOverrides(
      supabase as never,
      ["sec-a", "sec-b"],
    );

    expect(map.get("sec-a")).toBe(90);
    expect(map.get("sec-b")).toBe(null);
  });

  it("returns empty map when query fails (e.g. column not migrated)", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(async () => ({
            data: null,
            error: { message: "column does not exist", code: "42703" },
          })),
        })),
      })),
    };

    const map = await loadSectionMinAttendanceOverrides(supabase as never, ["sec-a"]);
    expect(map.size).toBe(0);
  });
});
