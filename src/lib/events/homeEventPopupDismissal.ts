export const HOME_EVENT_POPUP_STORAGE_KEY = "ge:home-event-popup";

export function homeEventPopupSetKey(eventIds: readonly string[]): string {
  return [...eventIds].toSorted().join(",");
}

export function shouldOpenHomeEventPopup(
  stored: string | null,
  eventIds: readonly string[],
): boolean {
  if (eventIds.length === 0) return false;
  return stored !== homeEventPopupSetKey(eventIds);
}

export function readHomeEventPopupDismissal(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(HOME_EVENT_POPUP_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeHomeEventPopupDismissal(eventIds: readonly string[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(HOME_EVENT_POPUP_STORAGE_KEY, homeEventPopupSetKey(eventIds));
  } catch {
    // Private mode can reject storage. The dialog still closes for this view.
  }
}
