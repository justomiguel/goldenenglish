import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DailyRoomClient } from "@/lib/academics/dailyRoomClient";
import { syncSectionDailyRooms } from "@/lib/academics/syncSectionDailyRooms";

// REGRESSION CHECK: Hybrid/remote create rooms only with credentials.
// In person deletes Daily rooms. A failed delete keeps the local row.

function makeClient(overrides: Partial<DailyRoomClient> = {}): DailyRoomClient {
  return {
    createPrivateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    createMeetingToken: vi.fn(),
    ...overrides,
  };
}

const slot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };
const credentials = { apiKey: "daily-key", domain: "academia.daily.co" };
const existing = { dayOfWeek: 1, startTime: "18:00", dailyRoomName: "soldroom" };

describe("syncSectionDailyRooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates one private room for a new hybrid slot when credentials exist", async () => {
    const createPrivateRoom = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://academia.daily.co/sroom1",
    });
    const client = makeClient({ createPrivateRoom });

    const result = await syncSectionDailyRooms({
      mode: "hybrid",
      slots: [slot],
      existing: [],
      credentials,
      client,
      createName: () => "sroom1",
    });

    expect(createPrivateRoom).toHaveBeenCalledOnce();
    expect(createPrivateRoom).toHaveBeenCalledWith({
      apiKey: "daily-key",
      roomName: "sroom1",
    });
    expect(result.failedSlots).toEqual([]);
    expect(result.rooms).toEqual([
      {
        dayOfWeek: 1,
        startTime: "18:00",
        dailyRoomName: "sroom1",
        dailyRoomUrl: "https://academia.daily.co/sroom1",
      },
    ]);
  });

  it("lists the slot as failed and skips Daily when credentials are missing", async () => {
    const createPrivateRoom = vi.fn();
    const client = makeClient({ createPrivateRoom });

    const result = await syncSectionDailyRooms({
      mode: "hybrid",
      slots: [slot],
      existing: [],
      credentials: null,
      client,
      createName: () => "sroom1",
    });

    expect(createPrivateRoom).not.toHaveBeenCalled();
    expect(result.rooms).toEqual([]);
    expect(result.failedSlots).toEqual([{ dayOfWeek: 1, startTime: "18:00" }]);
  });

  it("deletes every existing room when the mode is in person", async () => {
    const deleteRoom = vi.fn().mockResolvedValue({ ok: true });
    const client = makeClient({ deleteRoom });

    const result = await syncSectionDailyRooms({
      mode: "in_person",
      slots: [slot],
      existing: [existing],
      credentials,
      client,
      createName: () => "unused",
    });

    expect(deleteRoom).toHaveBeenCalledOnce();
    expect(deleteRoom).toHaveBeenCalledWith({
      apiKey: "daily-key",
      roomName: "soldroom",
    });
    expect(result.rooms).toEqual([]);
    expect(result.failedSlots).toEqual([]);
  });

  it("keeps a room and records the slot when Daily delete fails", async () => {
    const deleteRoom = vi.fn().mockResolvedValue({ ok: false, code: "daily_failed" });
    const client = makeClient({ deleteRoom });

    const result = await syncSectionDailyRooms({
      mode: "in_person",
      slots: [],
      existing: [existing],
      credentials,
      client,
      createName: () => "unused",
    });

    expect(result.failedSlots).toEqual([{ dayOfWeek: 1, startTime: "18:00" }]);
    expect(result.rooms).toEqual([
      {
        dayOfWeek: 1,
        startTime: "18:00",
        dailyRoomName: "soldroom",
        dailyRoomUrl: "",
      },
    ]);
  });
});
