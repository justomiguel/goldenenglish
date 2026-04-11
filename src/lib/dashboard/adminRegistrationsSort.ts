import type { AdminRegistrationRow } from "@/types/adminRegistration";

export type RegistrationSortKey =
  | "name"
  | "dni"
  | "email"
  | "level"
  | "birth"
  | "status"
  | "received";

export type RegistrationSortDir = "asc" | "desc";

function nameKey(r: AdminRegistrationRow): string {
  return `${r.first_name} ${r.last_name}`.trim();
}

/** Client-side text filter across main registration fields. */
export function filterRegistrationRows(
  rows: AdminRegistrationRow[],
  query: string,
): AdminRegistrationRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => {
    const hay = [
      nameKey(r),
      r.dni,
      r.email,
      r.phone ?? "",
      r.level_interest ?? "",
      r.status,
      r.birth_date ?? "",
      r.created_at ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function sortRegistrationRows(
  rows: AdminRegistrationRow[],
  key: RegistrationSortKey,
  dir: RegistrationSortDir,
): AdminRegistrationRow[] {
  const copy = [...rows];
  const mult = dir === "asc" ? 1 : -1;
  copy.sort((a, b) => {
    let va: string;
    let vb: string;
    switch (key) {
      case "name":
        va = nameKey(a);
        vb = nameKey(b);
        break;
      case "dni":
        va = a.dni;
        vb = b.dni;
        break;
      case "email":
        va = a.email;
        vb = b.email;
        break;
      case "level":
        va = a.level_interest ?? "";
        vb = b.level_interest ?? "";
        break;
      case "birth":
        va = a.birth_date ?? "";
        vb = b.birth_date ?? "";
        break;
      case "status":
        va = a.status;
        vb = b.status;
        break;
      case "received":
        va = a.created_at ?? "";
        vb = b.created_at ?? "";
        break;
      default:
        va = "";
        vb = "";
    }
    return va.localeCompare(vb, undefined, { sensitivity: "base", numeric: true }) * mult;
  });
  return copy;
}
