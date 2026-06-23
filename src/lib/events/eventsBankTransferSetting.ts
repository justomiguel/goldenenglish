/**
 * Pure helpers for the "accept bank transfer on event registration" toggle.
 * Stored in public.site_settings under this key as a JSON boolean.
 * No Supabase/React imports: safe to use from loaders, actions, and tests.
 */

export const EVENTS_BANK_TRANSFER_ENABLED_KEY = "events_bank_transfer_enabled";

/** Default applied when the admin has never set the toggle explicitly. */
export const EVENTS_BANK_TRANSFER_ENABLED_DEFAULT = true;

/**
 * Parse the stored site_settings value into an explicit boolean, or null when
 * unset/unknown so callers can apply their own fallback.
 */
export function parseEventsBankTransferEnabled(raw: unknown): boolean | null {
  if (raw === true || raw === "true") return true;
  if (raw === false || raw === "false") return false;
  return null;
}
