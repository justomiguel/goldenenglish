import {
  ADMIN_HOME_WIDGET_IDS,
  factoryAdminHomeLayout,
  item,
  layoutFromDraft,
  type AdminHomeCardSize,
  type AdminHomeLayout,
  type AdminHomePresetId,
  type AdminHomeWidgetId,
} from "@/lib/dashboard/adminHomeLayout";

type PresetRow = [AdminHomeWidgetId, AdminHomeCardSize, boolean?];

const PRESET_TAIL: Record<Exclude<AdminHomePresetId, "reset">, PresetRow[]> = {
  operations: [
    ["payments", "l"],
    ["registrations", "m"],
    ["messages", "s"],
    ["collections", "m"],
    ["upcomingEvents", "m"],
    ["traffic", "l"],
    ["people", "s"],
    ["birthdays", "s"],
    ["peoplePulse", "s"],
    ["shopOrders", "s"],
    ["changelog", "m"],
    ["shortcuts", "full"],
  ],
  people: [
    ["birthdays", "l"],
    ["people", "m"],
    ["peoplePulse", "s"],
    ["payments", "s"],
    ["registrations", "s"],
    ["messages", "s"],
    ["shopOrders", "s"],
    ["collections", "m"],
    ["upcomingEvents", "m"],
    ["traffic", "l"],
    ["changelog", "m"],
    ["shortcuts", "full"],
  ],
  compact: ADMIN_HOME_WIDGET_IDS.filter(
    (id) => id !== "checklist" && id !== "studentsWithoutSection",
  ).map((id) => [id, "s", id === "shortcuts"]),
};

export function applyAdminHomePreset(
  preset: AdminHomePresetId,
  options: { shopEnabled: boolean },
): AdminHomeLayout {
  if (preset === "reset") return factoryAdminHomeLayout(options);
  const pinned = [item("checklist", "full"), item("studentsWithoutSection", "full")];
  const tail = PRESET_TAIL[preset].map(([id, size, hidden]) => item(id, size, hidden === true));
  return layoutFromDraft([...pinned, ...tail], options);
}
