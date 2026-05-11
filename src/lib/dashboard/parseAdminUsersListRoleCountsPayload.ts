export type AdminUsersListRoleCounts = {
  total: number;
  /** Lowercase profile.role → count */
  byRole: Record<string, number>;
};

function coerceCount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.floor(n);
  }
  return 0;
}

/** Normalizes RPC `admin_users_list_role_counts` jsonb payload. */
export function parseAdminUsersListRoleCountsPayload(raw: unknown): AdminUsersListRoleCounts {
  if (!raw || typeof raw !== "object") {
    return { total: 0, byRole: {} };
  }
  const o = raw as Record<string, unknown>;
  const total = coerceCount(o.total);

  const byRole: Record<string, number> = {};
  const blob = o.by_role;
  if (blob && typeof blob === "object" && !Array.isArray(blob)) {
    for (const [key, val] of Object.entries(blob)) {
      const nk = key.trim().toLowerCase();
      if (!nk) continue;
      const c = coerceCount(val);
      if (c > 0) byRole[nk] = c;
    }
  }

  return { total, byRole };
}
