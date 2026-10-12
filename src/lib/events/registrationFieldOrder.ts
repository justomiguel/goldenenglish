export const REGISTRATION_QUESTION_BASE_IDS = [
  "firstName",
  "lastName",
  "dniOrPassport",
  "email",
  "phone",
  "birthDate",
] as const;

export type RegistrationQuestionBaseId = (typeof REGISTRATION_QUESTION_BASE_IDS)[number];

export type RegistrationFieldToken = `base:${RegistrationQuestionBaseId}` | `field:${string}`;

const BASE_ID_SET = new Set<string>(REGISTRATION_QUESTION_BASE_IDS);

export interface RegistrationOrderExtra {
  id: string;
  position: number;
  archived?: boolean;
}

export function baseFieldToken(id: RegistrationQuestionBaseId): RegistrationFieldToken {
  return `base:${id}`;
}

export function extraFieldToken(id: string): RegistrationFieldToken {
  return `field:${id}`;
}

export function isRegistrationFieldToken(value: string): value is RegistrationFieldToken {
  if (value.startsWith("base:")) return BASE_ID_SET.has(value.slice(5));
  return value.startsWith("field:") && value.length > "field:".length;
}

function legacyTokens(
  extras: readonly RegistrationOrderExtra[],
  collectBirthDate: boolean,
): RegistrationFieldToken[] {
  const bases = REGISTRATION_QUESTION_BASE_IDS.filter(
    (id) => id !== "birthDate" || collectBirthDate,
  ).map((id) => baseFieldToken(id));
  const active = extras
    .filter((extra) => !extra.archived)
    .toSorted((a, b) => a.position - b.position);
  return [...bases, ...active.map((extra) => extraFieldToken(extra.id))];
}

export function resolveRegistrationFieldOrder(input: {
  stored: readonly string[];
  extras: readonly RegistrationOrderExtra[];
  collectBirthDate: boolean;
}): RegistrationFieldToken[] {
  const legacy = legacyTokens(input.extras, input.collectBirthDate);
  if (input.stored.length === 0) return legacy;

  const activeIds = new Set(
    input.extras.filter((extra) => !extra.archived).map((extra) => extra.id),
  );
  const seen = new Set<string>();
  const result: RegistrationFieldToken[] = [];

  for (const raw of input.stored) {
    if (!isRegistrationFieldToken(raw) || seen.has(raw)) continue;
    if (raw.startsWith("field:")) {
      const id = raw.slice("field:".length);
      if (!activeIds.has(id)) continue;
    }
    if (raw === "base:birthDate" && !input.collectBirthDate) continue;
    result.push(raw);
    seen.add(raw);
  }

  for (const token of legacy) {
    if (!seen.has(token)) result.push(token);
  }
  return result;
}

/** Keep a hidden birth-date token in the stored array when the visible list omits it. */
export function retainHiddenBirthDateToken(
  previous: readonly string[],
  nextVisible: readonly string[],
  collectBirthDate: boolean,
): string[] {
  const visible = [...nextVisible];
  if (collectBirthDate || !previous.includes("base:birthDate") || visible.includes("base:birthDate")) {
    return visible;
  }
  const previousIndex = previous.indexOf("base:birthDate");
  const successor = previous.slice(previousIndex + 1).find((token) => visible.includes(token));
  if (!successor) return [...visible, "base:birthDate"];
  const insertAt = visible.indexOf(successor);
  return [...visible.slice(0, insertAt), "base:birthDate", ...visible.slice(insertAt)];
}
