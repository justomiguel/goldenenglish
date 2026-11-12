export const REGISTER_EXTRAS_PACKS = ["martial_arts_uniform", "family_guide"] as const;

export type RegisterExtrasPack = (typeof REGISTER_EXTRAS_PACKS)[number];

/** Reads the tenant setting. Old kind names are not packs. */
export function parseRegisterExtrasPack(value: string | null | undefined): RegisterExtrasPack | null {
  if (value === "martial_arts_uniform" || value === "family_guide") return value;
  return null;
}
