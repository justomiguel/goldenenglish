/**
 * Profile display helpers — single place for “surname first” + consistent sorting.
 * Pure module: no React / Supabase.
 */

export type ProfileNameParts = {
  firstName?: string | null;
  lastName?: string | null;
};

export type ProfileNameSnake = {
  first_name?: string | null;
  last_name?: string | null;
};

/** Visible label: last name(s) first, then given name(s). */
export function formatProfileNameSurnameFirst(
  firstName?: string | null,
  lastName?: string | null,
  fallback = "",
): string {
  const f = String(firstName ?? "").trim();
  const l = String(lastName ?? "").trim();
  if (!f && !l) return fallback;
  if (!f) return l;
  if (!l) return f;
  return `${l} ${f}`;
}

export function formatProfileSnakeSurnameFirst(
  row: ProfileNameSnake,
  fallback = "",
): string {
  return formatProfileNameSurnameFirst(row.first_name, row.last_name, fallback);
}

export function compareProfileNamesByLastThenFirst(a: ProfileNameParts, b: ProfileNameParts): number {
  const ln = String(a.lastName ?? "")
    .trim()
    .localeCompare(String(b.lastName ?? "").trim(), undefined, { sensitivity: "base" });
  if (ln !== 0) return ln;
  return String(a.firstName ?? "")
    .trim()
    .localeCompare(String(b.firstName ?? "").trim(), undefined, { sensitivity: "base" });
}

export function compareProfileSnakeByLastThenFirst(a: ProfileNameSnake, b: ProfileNameSnake): number {
  return compareProfileNamesByLastThenFirst(
    { firstName: a.first_name, lastName: a.last_name },
    { firstName: b.first_name, lastName: b.last_name },
  );
}
