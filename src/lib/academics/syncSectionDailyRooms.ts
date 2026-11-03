import type { SupabaseClient } from "@supabase/supabase-js";
import type { DailyRoomClient } from "@/lib/academics/dailyRoomClient";
import { createFetchDailyRoomClient } from "@/lib/academics/dailyRoomClient";
import { createDailyRoomName } from "@/lib/academics/dailyRoomName";
import { planDailyRoomSync } from "@/lib/academics/dailyRoomSyncPlan";
import { parseSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import type { SectionDeliveryMode } from "@/lib/academics/sectionDeliveryMode";

export type DailyRoomSlot = { dayOfWeek: number; startTime: string };
export type DailyRoomRecord = DailyRoomSlot & {
  dailyRoomName: string;
  dailyRoomUrl: string;
};

function slotKey(slot: DailyRoomSlot): string {
  return `${slot.dayOfWeek}\0${slot.startTime}`;
}

export async function syncSectionDailyRooms(input: {
  mode: SectionDeliveryMode;
  slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  existing: { dayOfWeek: number; startTime: string; dailyRoomName: string; dailyRoomUrl?: string }[];
  credentials: { apiKey: string; domain: string } | null;
  client: DailyRoomClient;
  createName: () => string;
}): Promise<{ failedSlots: DailyRoomSlot[]; rooms: DailyRoomRecord[] }> {
  const plan = planDailyRoomSync({
    mode: input.mode,
    slots: input.slots,
    existing: input.existing,
  });
  const deleteKeys = new Set(plan.delete.map(slotKey));
  const rooms: DailyRoomRecord[] = input.existing
    .filter((row) => !deleteKeys.has(slotKey(row)))
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      dailyRoomName: row.dailyRoomName,
      dailyRoomUrl: row.dailyRoomUrl ?? "",
    }));
  const failedSlots: DailyRoomSlot[] = [];

  for (const row of plan.delete) {
    const slot = { dayOfWeek: row.dayOfWeek, startTime: row.startTime };
    if (!input.credentials) {
      failedSlots.push(slot);
      rooms.push({
        ...slot,
        dailyRoomName: row.dailyRoomName,
        dailyRoomUrl: row.dailyRoomUrl ?? "",
      });
      continue;
    }
    const deleted = await input.client.deleteRoom({
      apiKey: input.credentials.apiKey,
      roomName: row.dailyRoomName,
    });
    if (deleted.ok) continue;
    failedSlots.push(slot);
    rooms.push({
      ...slot,
      dailyRoomName: row.dailyRoomName,
      dailyRoomUrl: row.dailyRoomUrl ?? "",
    });
  }

  for (const slot of plan.create) {
    const failed = { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime };
    if (!input.credentials) {
      failedSlots.push(failed);
      continue;
    }
    const dailyRoomName = input.createName();
    const created = await input.client.createPrivateRoom({
      apiKey: input.credentials.apiKey,
      roomName: dailyRoomName,
    });
    if (!created.ok) {
      failedSlots.push(failed);
      continue;
    }
    rooms.push({
      ...failed,
      dailyRoomName,
      dailyRoomUrl: created.url,
    });
  }

  return { failedSlots, rooms };
}

type PersistError = { message?: string; code?: string; details?: string | null; hint?: string | null };

export async function persistSectionDailyRooms(input: {
  supabase: SupabaseClient;
  sectionId: string;
  mode: SectionDeliveryMode;
  credentials: { apiKey: string; domain: string } | null;
}): Promise<
  | { ok: true; failedSlots: DailyRoomSlot[] }
  | { ok: false; error: PersistError }
> {
  const sectionRes = await input.supabase
    .from("academic_sections")
    .select("schedule_slots")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (sectionRes.error) return { ok: false, error: sectionRes.error };

  const roomsRes = await input.supabase
    .from("section_daily_rooms")
    .select("day_of_week, start_time, daily_room_name, daily_room_url")
    .eq("section_id", input.sectionId);
  if (roomsRes.error) return { ok: false, error: roomsRes.error };

  const existing = ((roomsRes.data ?? []) as {
    day_of_week: number;
    start_time: string;
    daily_room_name: string;
    daily_room_url: string;
  }[]).map((row) => ({
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    dailyRoomName: row.daily_room_name,
    dailyRoomUrl: row.daily_room_url,
  }));

  const synced = await syncSectionDailyRooms({
    mode: input.mode,
    slots: parseSectionScheduleSlots(sectionRes.data?.schedule_slots),
    existing,
    credentials: input.credentials,
    client: createFetchDailyRoomClient(fetch),
    createName: createDailyRoomName,
  });

  const keepKeys = new Set(synced.rooms.map(slotKey));
  const existingKeys = new Set(existing.map(slotKey));

  for (const room of synced.rooms) {
    if (existingKeys.has(slotKey(room))) continue;
    const inserted = await input.supabase.from("section_daily_rooms").insert({
      section_id: input.sectionId,
      day_of_week: room.dayOfWeek,
      start_time: room.startTime,
      daily_room_name: room.dailyRoomName,
      daily_room_url: room.dailyRoomUrl,
    });
    if (inserted.error) return { ok: false, error: inserted.error };
  }

  for (const row of existing) {
    if (keepKeys.has(slotKey(row))) continue;
    const deleted = await input.supabase
      .from("section_daily_rooms")
      .delete()
      .eq("section_id", input.sectionId)
      .eq("day_of_week", row.dayOfWeek)
      .eq("start_time", row.startTime);
    if (deleted.error) return { ok: false, error: deleted.error };
  }

  return { ok: true, failedSlots: synced.failedSlots };
}
