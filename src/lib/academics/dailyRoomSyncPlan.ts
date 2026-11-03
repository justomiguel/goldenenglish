type SlotKey = { dayOfWeek: number; startTime: string };

export type DailyRoomSyncRow = SlotKey & {
  dailyRoomName: string;
  dailyRoomUrl?: string;
};

function slotKey(slot: SlotKey): string {
  return `${slot.dayOfWeek}\0${slot.startTime}`;
}

export function planDailyRoomSync(input: {
  mode: "in_person" | "hybrid" | "remote";
  slots: SlotKey[];
  existing: DailyRoomSyncRow[];
}): {
  create: SlotKey[];
  delete: DailyRoomSyncRow[];
} {
  if (input.mode === "in_person") {
    return { create: [], delete: [...input.existing] };
  }

  const desired = new Set(input.slots.map(slotKey));
  const create = input.slots.filter(
    (slot) => !input.existing.some((row) => slotKey(row) === slotKey(slot)),
  );
  const del = input.existing.filter((row) => !desired.has(slotKey(row)));

  return { create, delete: del };
}
