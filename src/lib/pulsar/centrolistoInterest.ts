export const CENTROLISTO_INTEREST_IDS = [
  "presencia",
  "medida",
  "gestion",
  "ecosistema",
  "unsure",
] as const;

export type CentrolistoInterestId = (typeof CENTROLISTO_INTEREST_IDS)[number];

const INTEREST_SET = new Set<string>(CENTROLISTO_INTEREST_IDS);

/** `demo` is the generic commercial ask. It maps to "not sure yet". */
export function readCentrolistoInterest(value: string | readonly string[] | null | undefined): CentrolistoInterestId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const token = raw?.trim().toLowerCase() ?? "";
  if (token === "demo") return "unsure";
  return INTEREST_SET.has(token) ? (token as CentrolistoInterestId) : null;
}
