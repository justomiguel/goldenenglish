import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DailyRoomClient } from "@/lib/academics/dailyRoomClient";
import { issueSectionDailyToken } from "@/lib/academics/issueSectionDailyToken";

// REGRESSION CHECK: Only teacher and active student get a token. The token
// never enters product metadata. Assistants, a closed window, a missing room,
// and a Daily failure stay denials. isOwner is true only for the teacher.

const mondaySlot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };
const mondayRoom = {
  dayOfWeek: 1,
  startTime: "18:00",
  dailyRoomName: "s" + "a".repeat(32),
  dailyRoomUrl: "https://academia.daily.co/sroom",
};
const insideMondayWindow = new Date("2026-11-02T21:00:00.000Z");
const credentials = { apiKey: "daily-key", domain: "academia.daily.co" };

function makeClient(overrides: Partial<DailyRoomClient> = {}): DailyRoomClient {
  return {
    createPrivateRoom: vi.fn(),
    deleteRoom: vi.fn(),
    createMeetingToken: vi.fn().mockResolvedValue({ ok: true, token: "meet-token" }),
    ...overrides,
  };
}

function baseInput(overrides: Partial<Parameters<typeof issueSectionDailyToken>[0]> = {}) {
  return {
    now: insideMondayWindow,
    timeZone: "America/Argentina/Cordoba",
    plan: "ecosistema" as const,
    mode: "remote" as const,
    credentials,
    slots: [mondaySlot],
    rooms: [mondayRoom],
    role: "teacher" as const,
    userName: "García Ana",
    requested: null,
    client: makeClient(),
    ...overrides,
  };
}

describe("issueSectionDailyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gives the teacher the stored url and an owner token inside the Monday 18:00 window", async () => {
    const createMeetingToken = vi.fn().mockResolvedValue({ ok: true, token: "teacher-token" });
    const client = makeClient({ createMeetingToken });

    const result = await issueSectionDailyToken(baseInput({ client }));

    expect(result).toEqual({
      ok: true,
      url: mondayRoom.dailyRoomUrl,
      token: "teacher-token",
      dayOfWeek: 1,
      startTime: "18:00",
    });
    expect(createMeetingToken).toHaveBeenCalledWith({
      apiKey: "daily-key",
      roomName: mondayRoom.dailyRoomName,
      expUnix: Math.floor(new Date("2026-11-03T00:00:00.000Z").getTime() / 1000),
      isOwner: true,
      userName: "García Ana",
    });
  });

  it("gives a student a non-owner token", async () => {
    const createMeetingToken = vi.fn().mockResolvedValue({ ok: true, token: "student-token" });
    const client = makeClient({ createMeetingToken });

    const result = await issueSectionDailyToken(baseInput({ role: "student", client }));

    expect(result.ok).toBe(true);
    expect(createMeetingToken).toHaveBeenCalledWith(
      expect.objectContaining({ isOwner: false, userName: "García Ana" }),
    );
  });

  it("denies an assistant without calling Daily", async () => {
    const createMeetingToken = vi.fn();
    const client = makeClient({ createMeetingToken });

    await expect(issueSectionDailyToken(baseInput({ role: "assistant", client }))).resolves.toEqual({
      ok: false,
      code: "person",
    });
    expect(createMeetingToken).not.toHaveBeenCalled();
  });

  it("denies a Wednesday request when only Monday is open", async () => {
    const createMeetingToken = vi.fn();
    const client = makeClient({ createMeetingToken });

    await expect(
      issueSectionDailyToken(
        baseInput({
          client,
          slots: [mondaySlot, { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" }],
          rooms: [
            mondayRoom,
            {
              dayOfWeek: 3,
              startTime: "18:00",
              dailyRoomName: "s" + "b".repeat(32),
              dailyRoomUrl: "https://academia.daily.co/swed",
            },
          ],
          requested: { dayOfWeek: 3, startTime: "18:00" },
        }),
      ),
    ).resolves.toEqual({ ok: false, code: "window" });
    expect(createMeetingToken).not.toHaveBeenCalled();
  });

  it("denies when the open slot has no room row", async () => {
    const createMeetingToken = vi.fn();
    const client = makeClient({ createMeetingToken });

    await expect(
      issueSectionDailyToken(baseInput({ client, rooms: [] })),
    ).resolves.toEqual({ ok: false, code: "room" });
    expect(createMeetingToken).not.toHaveBeenCalled();
  });

  it("returns daily_failed when the client cannot mint a token", async () => {
    const createMeetingToken = vi.fn().mockResolvedValue({ ok: false, code: "daily_failed" });
    const client = makeClient({ createMeetingToken });

    await expect(issueSectionDailyToken(baseInput({ client }))).resolves.toEqual({
      ok: false,
      code: "daily_failed",
    });
  });

  it("lets the caller record sectionId, dayOfWeek, and startTime without the token", async () => {
    const result = await issueSectionDailyToken(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const metadata = {
      sectionId: "11111111-1111-1111-1111-111111111111",
      dayOfWeek: result.dayOfWeek,
      startTime: result.startTime,
    };
    expect(metadata).toEqual({
      sectionId: "11111111-1111-1111-1111-111111111111",
      dayOfWeek: 1,
      startTime: "18:00",
    });
    expect(JSON.stringify(metadata)).not.toContain(result.token);
    expect(metadata).not.toHaveProperty("token");
  });
});
