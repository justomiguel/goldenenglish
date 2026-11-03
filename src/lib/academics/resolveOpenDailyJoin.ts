import { denyDailyJoin } from "@/lib/academics/dailyJoinDenial";
import { openDailyWindow } from "@/lib/academics/dailyJoinWindow";
import { zonedWallTimeToUtc } from "@/lib/admin-digest/closedWeekBounds";
import type { SectionDeliveryMode } from "@/lib/academics/sectionDeliveryMode";
import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function wallYmd(instant: Date, timeZone: string): { y: number; m: number; d: number; weekday: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(instant)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    y: Number(map.year),
    m: Number(map.month),
    d: Number(map.day),
    weekday: WEEKDAY_INDEX[map.weekday] ?? 0,
  };
}

function addCalendarDays(y: number, m: number, d: number, delta: number): { y: number; m: number; d: number } {
  const shifted = new Date(Date.UTC(y, m - 1, d + delta));
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() };
}

export type OpenDailyJoinCandidate = {
  sectionId: string;
  label: string;
  teacher: string;
  mode: SectionDeliveryMode;
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  rooms: { dayOfWeek: number; startTime: string }[];
};

export type OpenDailyJoinOffer = {
  joinHref: string;
  openClass: { label: string; teacher: string; startIso: string };
};

function localSlotStartIso(now: Date, dayOfWeek: number, startTime: string, timeZone: string): string {
  const [hour, minute] = startTime.split(":").map(Number);
  const today = wallYmd(now, timeZone);
  for (const shift of [-1, 0, 1]) {
    if ((today.weekday + shift + 7) % 7 !== dayOfWeek) continue;
    const day = addCalendarDays(today.y, today.m, today.d, shift);
    return zonedWallTimeToUtc(day.y, day.m, day.d, hour, minute, 0, 0, timeZone).toISOString();
  }
  return now.toISOString();
}

export function resolveOpenDailyJoin(input: {
  now: Date;
  timeZone: string;
  plan: CommercialPlan;
  credentialsReady: boolean;
  role: "teacher" | "student";
  locale: string;
  persona: "student" | "teacher";
  candidates: OpenDailyJoinCandidate[];
}): OpenDailyJoinOffer | null {
  const ranked: Array<OpenDailyJoinOffer & { slotStartMs: number }> = [];

  for (const candidate of input.candidates) {
    const open = openDailyWindow({
      now: input.now,
      timeZone: input.timeZone,
      slots: candidate.slots,
    });
    const hasRoom = Boolean(
      open &&
        candidate.rooms.some(
          (room) => room.dayOfWeek === open.dayOfWeek && room.startTime === open.startTime,
        ),
    );
    const denial = denyDailyJoin({
      plan: input.plan,
      mode: candidate.mode,
      hasCredentials: input.credentialsReady,
      hasRoom,
      windowOpen: open !== null,
      role: input.role,
    });
    if (denial || !open) continue;

    const startIso = localSlotStartIso(input.now, open.dayOfWeek, open.startTime, input.timeZone);
    ranked.push({
      joinHref: `/${input.locale}/dashboard/${input.persona}/sections/${candidate.sectionId}/class?day=${open.dayOfWeek}&start=${open.startTime}`,
      openClass: {
        label: candidate.label,
        teacher: candidate.teacher,
        startIso,
      },
      slotStartMs: new Date(startIso).getTime(),
    });
  }

  ranked.sort((a, b) => a.slotStartMs - b.slotStartMs);
  const winner = ranked[0];
  if (!winner) return null;
  return { joinHref: winner.joinHref, openClass: winner.openClass };
}
