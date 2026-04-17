import { randomBytes } from "node:crypto";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const SELECT_FULL =
  "first_name, last_name, phone, dni_or_passport, birth_date, avatar_url, role, is_minor" as const;
const SELECT_FALLBACK =
  "first_name, last_name, phone, dni_or_passport, birth_date, avatar_url, role" as const;

export type DashboardProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  dni_or_passport: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  role: string | null;
  is_minor?: boolean | null;
};

const ROLES = new Set(["admin", "teacher", "student", "parent", "assistant"]);

export function profileRoleFromUserMetadata(meta: Record<string, unknown> | undefined): string {
  const r = meta?.role;
  if (typeof r === "string" && ROLES.has(r)) return r;
  return "student";
}

async function selectProfileRow(
  client: SupabaseClient,
  userId: string,
): Promise<DashboardProfileRow | null> {
  const { data: full } = await client
    .from("profiles")
    .select(SELECT_FULL)
    .eq("id", userId)
    .maybeSingle();
  if (full) return full as DashboardProfileRow;
  const { data: fb } = await client
    .from("profiles")
    .select(SELECT_FALLBACK)
    .eq("id", userId)
    .maybeSingle();
  return (fb as DashboardProfileRow) ?? null;
}

function provisioningDni(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const d = meta.dni_or_passport;
  if (typeof d === "string" && d.trim().length > 0) return d.trim();
  return `pending-${user.id.replace(/-/g, "")}`;
}

function buildInsertPayload(user: User, dni: string): Record<string, unknown> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const emailPrefix = user.email?.split("@")[0]?.trim();
  const first =
    String(meta.first_name ?? "").trim() ||
    (emailPrefix ? emailPrefix.slice(0, 120) : "") ||
    "—";
  const last = String(meta.last_name ?? "").trim() || "—";
  const phoneRaw = meta.phone;
  const phone =
    typeof phoneRaw === "string" && phoneRaw.trim() ? phoneRaw.trim().slice(0, 40) : null;
  const bdRaw = meta.birth_date;
  const birth_date =
    typeof bdRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(bdRaw.trim()) ? bdRaw.trim() : null;
  return {
    id: user.id,
    role: profileRoleFromUserMetadata(meta),
    first_name: first.slice(0, 120),
    last_name: last.slice(0, 120),
    dni_or_passport: dni,
    phone,
    birth_date,
  };
}

/**
 * Lee `profiles` con el cliente de sesión; si no hay fila (RLS ausente, trigger fallido, etc.)
 * y existe `SUPABASE_SERVICE_ROLE_KEY`, intenta lectura con service role y, si sigue sin fila,
 * inserta una fila mínima alineada con `handle_new_user` + metadata de Auth.
 */
export async function loadOrProvisionDashboardProfileRow(
  user: User,
): Promise<DashboardProfileRow | null> {
  const supabase = await createClient();
  let row = await selectProfileRow(supabase, user.id);
  if (row) return row;

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;

  try {
    const admin = createAdminClient();
    row = await selectProfileRow(admin, user.id);
    if (row) return row;

    const baseDni = provisioningDni(user);
    for (let attempt = 0; attempt < 3; attempt++) {
      const dni =
        attempt === 0
          ? baseDni
          : `${`pending-${user.id.replace(/-/g, "")}`}-${randomBytes(3).toString("hex")}`;
      const payload = buildInsertPayload(user, dni);
      const { data: inserted, error } = await admin
        .from("profiles")
        .insert(payload)
        .select(SELECT_FULL)
        .maybeSingle();
      if (!error && inserted) return inserted as DashboardProfileRow;
      if (error?.code !== "23505") {
        logSupabaseClientError("loadOrProvisionDashboardProfileRow:profilesInsert", error, {
          userId: user.id,
        });
        break;
      }
    }

    return (await selectProfileRow(admin, user.id)) ?? null;
  } catch (err) {
    logServerException("loadOrProvisionDashboardProfileRow", err, { userId: user.id });
    return null;
  }
}
