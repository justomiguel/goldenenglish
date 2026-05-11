const MAX_TEXT = 500;
const MAX_PLACE_ID = 256;

export type NormalizedHomeAddress = { text: string | null; placeId: string | null };

export type NormalizeHomeAddressErrorCode = "home_address_too_long" | "home_place_id_too_long";

export function normalizeHomeAddressInput(
  textRaw: string,
  placeIdRaw: string | null | undefined,
):
  | { ok: true; value: NormalizedHomeAddress }
  | { ok: false; code: NormalizeHomeAddressErrorCode } {
  const text = textRaw.trim();
  const pidRaw = placeIdRaw != null ? String(placeIdRaw).trim() : "";
  const placeId = pidRaw.length > 0 ? pidRaw : null;

  if (text.length > MAX_TEXT) return { ok: false, code: "home_address_too_long" };
  if (placeId && placeId.length > MAX_PLACE_ID) return { ok: false, code: "home_place_id_too_long" };

  if (!text) return { ok: true, value: { text: null, placeId: null } };
  return { ok: true, value: { text, placeId } };
}
