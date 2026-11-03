import { denyDailyJoin } from "@/lib/academics/dailyJoinDenial";
import { openDailyWindow } from "@/lib/academics/dailyJoinWindow";
import type { DailyRoomClient } from "@/lib/academics/dailyRoomClient";
import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";

type DailySlot = { dayOfWeek: number; startTime: string; endTime: string };
type DailyRoom = {
  dayOfWeek: number;
  startTime: string;
  dailyRoomName: string;
  dailyRoomUrl: string;
};
type DailyRole = "teacher" | "student" | "assistant" | "other";
type RequestedSlot = { dayOfWeek: number; startTime: string };

export type IssueSectionDailyTokenInput = {
  now: Date;
  timeZone: string;
  plan: CommercialPlan;
  mode: "in_person" | "hybrid" | "remote";
  credentials: { apiKey: string; domain: string } | null;
  slots: DailySlot[];
  rooms: DailyRoom[];
  role: DailyRole;
  userName: string;
  requested: RequestedSlot | null;
  client: DailyRoomClient;
};

export type IssueSectionDailyTokenResult =
  | { ok: true; url: string; token: string; dayOfWeek: number; startTime: string }
  | { ok: false; code: "plan" | "mode" | "credentials" | "room" | "window" | "person" | "daily_failed" };

function sameSlot(a: RequestedSlot, b: RequestedSlot): boolean {
  return a.dayOfWeek === b.dayOfWeek && a.startTime === b.startTime;
}

function findRoom(rooms: DailyRoom[], slot: RequestedSlot): DailyRoom | null {
  return rooms.find((room) => sameSlot(room, slot)) ?? null;
}

export async function issueSectionDailyToken(
  input: IssueSectionDailyTokenInput,
): Promise<IssueSectionDailyTokenResult> {
  const candidateSlots = input.requested
    ? input.slots.filter((slot) => sameSlot(slot, input.requested!))
    : input.slots;
  const open = openDailyWindow({
    now: input.now,
    timeZone: input.timeZone,
    slots: candidateSlots,
  });
  const target = input.requested ?? (open ? { dayOfWeek: open.dayOfWeek, startTime: open.startTime } : null);
  const room = target ? findRoom(input.rooms, target) : null;
  const denial = denyDailyJoin({
    plan: input.plan,
    mode: input.mode,
    hasCredentials: input.credentials !== null,
    hasRoom: target ? room !== null : true,
    windowOpen: open !== null,
    role: input.role,
  });
  if (denial) return { ok: false, code: denial };
  if (!open || !room || !input.credentials) return { ok: false, code: "window" };

  const minted = await input.client.createMeetingToken({
    apiKey: input.credentials.apiKey,
    roomName: room.dailyRoomName,
    expUnix: open.expUnix,
    isOwner: input.role === "teacher",
    userName: input.userName,
  });
  if (!minted.ok) return { ok: false, code: "daily_failed" };

  return {
    ok: true,
    url: room.dailyRoomUrl,
    token: minted.token,
    dayOfWeek: open.dayOfWeek,
    startTime: open.startTime,
  };
}
