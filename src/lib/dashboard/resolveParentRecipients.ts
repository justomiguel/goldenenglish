import type { SupabaseClient } from "@supabase/supabase-js";
import { isDeliverableAuthEmail } from "@/lib/auth/isSyntheticAuthEmail";
import { loadParentIdsForActiveSection } from "@/lib/dashboard/loadParentIdsForActiveSection";
import { loadAdminParentDirectoryExtras } from "@/lib/dashboard/loadAdminParentDirectoryExtras";
import { applyParentScopeDirectoryFilters } from "@/lib/dashboard/applyParentScopeDirectoryFilters";
import { capParentRecipients } from "@/lib/parents/capParentRecipients";
import type { InviteParentRow } from "@/lib/email/inviteParentsToPlatform";
import type { ParentRecipientScope } from "@/lib/parents/parseParentRecipientScope";

const PROFILE_COLS = "id, first_name, last_name, phone, created_at, last_session_start_at";

async function emailsForIds(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const emailById = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) emailById.set(id, data.user.email);
    }),
  );
  return emailById;
}

function toRows(
  profiles: Array<{ id: string; first_name: string | null; last_name: string | null }>,
  emailById: Map<string, string>,
): InviteParentRow[] {
  return capParentRecipients(
    profiles.map((p) => {
      const authEmail = emailById.get(p.id) ?? null;
      return {
        id: p.id,
        firstName: p.first_name?.trim() ?? "",
        lastName: p.last_name?.trim() ?? "",
        authEmail,
        email: authEmail && isDeliverableAuthEmail(authEmail) ? authEmail : null,
      };
    }),
  );
}

export async function resolveParentRecipients(
  admin: SupabaseClient,
  scope: ParentRecipientScope,
): Promise<InviteParentRow[]> {
  if (scope.kind === "ids") {
    const ids = [...new Set(scope.ids)].slice(0, 200);
    if (ids.length === 0) return [];
    const { data } = await admin
      .from("profiles")
      .select(PROFILE_COLS)
      .eq("role", "parent")
      .in("id", ids);
    const profiles = (data ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>;
    return toRows(profiles, await emailsForIds(admin, profiles.map((p) => p.id)));
  }

  let allowedIds: string[] | null = null;
  if (scope.section) {
    allowedIds = await loadParentIdsForActiveSection(admin, scope.section);
    if (allowedIds.length === 0) return [];
  }

  let query = admin.from("profiles").select(PROFILE_COLS).eq("role", "parent");
  if (allowedIds) query = query.in("id", allowedIds);
  if (scope.access === "never") query = query.is("last_session_start_at", null);
  if (scope.access === "entered") query = query.not("last_session_start_at", "is", null);
  if (scope.q) {
    const q = scope.q.replace(/,/g, " ");
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  const { data } = await query.order("last_name", { ascending: true }).limit(2000);
  const profiles = (data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    created_at: string | null;
    last_session_start_at: string | null;
  }>;
  const emailById = await emailsForIds(admin, profiles.map((p) => p.id));
  const extras = await loadAdminParentDirectoryExtras(
    admin,
    profiles.map((p) => p.id),
  );
  const filtered = applyParentScopeDirectoryFilters(profiles, scope, {
    childrenByParent: extras.childrenByParent,
    emailById,
  });
  return toRows(filtered, emailById);
}
