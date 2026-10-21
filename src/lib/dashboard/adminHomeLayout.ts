export const ADMIN_HOME_WIDGET_IDS = [
  "checklist",
  "studentsWithoutSection",
  "payments",
  "registrations",
  "messages",
  "people",
  "birthdays",
  "peoplePulse",
  "collections",
  "upcomingEvents",
  "traffic",
  "shopOrders",
  "changelog",
  "shortcuts",
] as const;

export type AdminHomeWidgetId = (typeof ADMIN_HOME_WIDGET_IDS)[number];
export type AdminHomeCardSize = "s" | "m" | "l" | "full";
export type AdminHomePresetId = "operations" | "people" | "compact" | "reset";

export interface AdminHomeLayoutItem {
  id: AdminHomeWidgetId;
  size: AdminHomeCardSize;
  hidden: boolean;
}

export interface AdminHomeLayout {
  version: 1;
  items: AdminHomeLayoutItem[];
}

export interface AdminHomeVisibility {
  shopEnabled: boolean;
  checklistDone: boolean;
  studentsWithoutSection: number;
  hasCurrentCohort: boolean;
}

export interface PlacedAdminHomeCard {
  id: AdminHomeWidgetId;
  size: AdminHomeCardSize;
  columns: number;
  row: number;
}

const SIZE_COLUMNS: Record<AdminHomeCardSize, number> = { s: 4, m: 6, l: 8, full: 12 };
const SIZE_RANK: Record<AdminHomeCardSize, number> = { s: 0, m: 1, l: 2, full: 3 };
const MIN_SIZE: Partial<Record<AdminHomeWidgetId, AdminHomeCardSize>> = {
  traffic: "l",
  collections: "m",
};
const WIDGET_SET = new Set<string>(ADMIN_HOME_WIDGET_IDS);

const FACTORY_SIZES: Record<AdminHomeWidgetId, AdminHomeCardSize> = {
  checklist: "full",
  studentsWithoutSection: "full",
  payments: "s",
  registrations: "s",
  messages: "s",
  people: "s",
  birthdays: "s",
  peoplePulse: "s",
  collections: "m",
  upcomingEvents: "m",
  traffic: "l",
  shopOrders: "s",
  changelog: "m",
  shortcuts: "full",
};

function isWidgetId(value: string): value is AdminHomeWidgetId {
  return WIDGET_SET.has(value);
}

function isSize(value: unknown): value is AdminHomeCardSize {
  return value === "s" || value === "m" || value === "l" || value === "full";
}

export function clampAdminHomeSize(id: AdminHomeWidgetId, size: AdminHomeCardSize): AdminHomeCardSize {
  const min = MIN_SIZE[id] ?? "s";
  return SIZE_RANK[size] < SIZE_RANK[min] ? min : size;
}

export function adminHomeSizeAllowed(id: AdminHomeWidgetId, size: AdminHomeCardSize): boolean {
  return clampAdminHomeSize(id, size) === size;
}

export function adminHomeColumns(size: AdminHomeCardSize): number {
  return SIZE_COLUMNS[size];
}

export function item(id: AdminHomeWidgetId, size: AdminHomeCardSize, hidden = false): AdminHomeLayoutItem {
  return { id, size: clampAdminHomeSize(id, size), hidden };
}

export function factoryAdminHomeLayout(options: { shopEnabled: boolean }): AdminHomeLayout {
  const items = ADMIN_HOME_WIDGET_IDS.filter((id) => options.shopEnabled || id !== "shopOrders").map((id) =>
    item(id, FACTORY_SIZES[id]),
  );
  return { version: 1, items };
}

export function layoutFromDraft(
  draft: AdminHomeLayoutItem[],
  options: { shopEnabled: boolean },
): AdminHomeLayout {
  const seen = new Set<AdminHomeWidgetId>();
  const items: AdminHomeLayoutItem[] = [];
  for (const entry of draft) {
    if (!options.shopEnabled && entry.id === "shopOrders") continue;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    items.push(item(entry.id, entry.size, entry.hidden));
  }
  for (const id of ADMIN_HOME_WIDGET_IDS) {
    if (!options.shopEnabled && id === "shopOrders") continue;
    if (seen.has(id)) continue;
    items.push(item(id, FACTORY_SIZES[id]));
  }
  return { version: 1, items };
}

export function readAdminHomeLayout(raw: unknown, options: { shopEnabled: boolean }): AdminHomeLayout {
  if (!raw || typeof raw !== "object") return factoryAdminHomeLayout(options);
  const record = raw as { version?: unknown; items?: unknown };
  if (record.version !== 1 || !Array.isArray(record.items)) return factoryAdminHomeLayout(options);
  const draft: AdminHomeLayoutItem[] = [];
  for (const entry of record.items) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as { id?: unknown; size?: unknown; hidden?: unknown };
    if (typeof row.id !== "string" || !isWidgetId(row.id) || !isSize(row.size)) continue;
    draft.push({ id: row.id, size: row.size, hidden: row.hidden === true });
  }
  return layoutFromDraft(draft, options);
}

function replaceItem(
  layout: AdminHomeLayout,
  id: AdminHomeWidgetId,
  next: (current: AdminHomeLayoutItem) => AdminHomeLayoutItem,
): AdminHomeLayout {
  return {
    version: 1,
    items: layout.items.map((entry) => (entry.id === id ? next(entry) : entry)),
  };
}

export function setAdminHomeItemSize(
  layout: AdminHomeLayout,
  id: AdminHomeWidgetId,
  size: AdminHomeCardSize,
): AdminHomeLayout {
  return replaceItem(layout, id, (entry) => ({ ...entry, size: clampAdminHomeSize(id, size) }));
}

export function setAdminHomeItemHidden(
  layout: AdminHomeLayout,
  id: AdminHomeWidgetId,
  hidden: boolean,
): AdminHomeLayout {
  return replaceItem(layout, id, (entry) => ({ ...entry, hidden }));
}

export function moveAdminHomeItem(
  layout: AdminHomeLayout,
  id: AdminHomeWidgetId,
  direction: "up" | "down",
): AdminHomeLayout {
  const index = layout.items.findIndex((entry) => entry.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= layout.items.length) return layout;
  const items = layout.items.slice();
  const current = items[index];
  const neighbor = items[target];
  if (!current || !neighbor) return layout;
  items[index] = neighbor;
  items[target] = current;
  return { version: 1, items };
}

function skipped(id: AdminHomeWidgetId, ctx: AdminHomeVisibility): boolean {
  if (id === "checklist") return ctx.checklistDone;
  if (id === "studentsWithoutSection") return ctx.studentsWithoutSection === 0;
  if (id === "collections") return !ctx.hasCurrentCohort;
  if (id === "shopOrders") return !ctx.shopEnabled;
  return false;
}

export function visibleAdminHomeCards(
  layout: AdminHomeLayout,
  ctx: AdminHomeVisibility,
): PlacedAdminHomeCard[] {
  const placed: PlacedAdminHomeCard[] = [];
  let row = 0;
  let used = 0;
  for (const entry of layout.items) {
    if (entry.hidden || skipped(entry.id, ctx)) continue;
    const size = clampAdminHomeSize(entry.id, entry.size);
    const columns = SIZE_COLUMNS[size];
    if (used > 0 && used + columns > 12) {
      row += 1;
      used = 0;
    }
    placed.push({ id: entry.id, size, columns, row });
    used += columns;
    if (used >= 12) {
      row += 1;
      used = 0;
    }
  }
  return placed;
}
