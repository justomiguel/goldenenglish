/** Shared table cell chrome for the admin event attendees list. */
export const ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL =
  "px-3 py-2.5 text-left font-semibold";

export const ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL =
  "px-3 py-3 align-middle text-[var(--color-foreground)]";

/** Sticky actions column so “More details” never overlaps custom field cells. */
export const ADMIN_EVENT_ATTENDEES_TABLE_ACTIONS_HEAD_CELL =
  `${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} sticky right-0 z-20 min-w-[13rem] whitespace-nowrap text-right bg-[color-mix(in_srgb,var(--color-muted)_92%,var(--color-surface))] shadow-[-6px_0_10px_-6px_color-mix(in_srgb,var(--color-foreground)_18%,transparent)]`;

export const ADMIN_EVENT_ATTENDEES_TABLE_CUSTOM_HEAD_CELL =
  `${ADMIN_EVENT_ATTENDEES_TABLE_HEAD_CELL} min-w-[5.5rem] max-w-[11rem]`;

export const ADMIN_EVENT_ATTENDEES_TABLE_CUSTOM_BODY_CELL =
  `${ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL} min-w-[5.5rem] max-w-[11rem] overflow-hidden`;

export const ADMIN_EVENT_ATTENDEES_TABLE_TEXT =
  "block truncate text-sm";

export const ADMIN_EVENT_ATTENDEES_TABLE_TEXT_PROMINENT =
  "block truncate text-sm font-semibold";

export const ADMIN_EVENT_ATTENDEES_TABLE_TEXT_MONO =
  "block truncate font-mono text-xs";

export function adminEventAttendeesActionsBodyCellClass(expanded: boolean): string {
  const surface = expanded
    ? "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]"
    : "bg-[var(--color-background)]";
  return `${ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL} sticky right-0 z-10 min-w-[13rem] overflow-visible text-right ${surface} shadow-[-6px_0_10px_-6px_color-mix(in_srgb,var(--color-foreground)_14%,transparent)]`;
}
