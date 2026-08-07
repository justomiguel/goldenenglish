import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { SectionStaffAssignedPerson } from "@/lib/academics/sectionStaffAssignedPerson";

type ProfileRow = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string | null;
  dni_or_passport: string | null;
  avatar_url: string | null;
};

export type EnrichSectionStaffAssignedPeopleInput = {
  leadTeacherId: string | null | undefined;
  assistants: { id: string; role: string }[];
  /** Test seam — defaults to Auth Admin lookups for assigned ids only. */
  resolveEmails?: (ids: string[]) => Promise<Map<string, string | null>>;
};

async function defaultResolveEmails(ids: string[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  if (ids.length === 0) return out;
  try {
    const admin = createAdminClient();
    await Promise.all(
      ids.map(async (id) => {
        try {
          const { data, error } = await admin.auth.admin.getUserById(id);
          if (error) {
            logServerWarn("enrichSectionStaffAssignedPeople:getUserById", {
              reason: "auth_lookup_failed",
              userId: id,
              code: error.message,
            });
            out.set(id, null);
            return;
          }
          const email = data.user?.email?.trim() || null;
          out.set(id, email);
        } catch (err) {
          logServerWarn("enrichSectionStaffAssignedPeople:getUserById", {
            reason: "auth_lookup_exception",
            userId: id,
            message: err instanceof Error ? err.message : "unknown",
          });
          out.set(id, null);
        }
      }),
    );
  } catch (err) {
    logServerWarn("enrichSectionStaffAssignedPeople:createAdminClient", {
      reason: "admin_client_unavailable",
      message: err instanceof Error ? err.message : "unknown",
    });
    for (const id of ids) out.set(id, null);
  }
  return out;
}

function trimOrNull(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

/**
 * Loads display fields for the section lead + portal assistants (bounded id set).
 */
export async function enrichSectionStaffAssignedPeople(
  supabase: SupabaseClient,
  input: EnrichSectionStaffAssignedPeopleInput,
): Promise<SectionStaffAssignedPerson[]> {
  const leadId = input.leadTeacherId?.trim() || null;
  const assistantIds = [...new Set(input.assistants.map((a) => a.id).filter(Boolean))];
  const orderedIds = [...(leadId ? [leadId] : []), ...assistantIds.filter((id) => id !== leadId)];
  if (orderedIds.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, role, phone, dni_or_passport, avatar_url")
    .in("id", orderedIds);

  if (error) {
    logSupabaseClientError("enrichSectionStaffAssignedPeople:profilesSelect", error, {
      count: orderedIds.length,
    });
    return [];
  }

  const byId = new Map((data ?? []).map((row) => [row.id as string, row as ProfileRow]));
  const resolveEmails = input.resolveEmails ?? defaultResolveEmails;
  const emailById = await resolveEmails(orderedIds);

  const uniqueAvatars = [
    ...new Set(
      orderedIds
        .map((id) => trimOrNull(byId.get(id)?.avatar_url))
        .filter((u): u is string => Boolean(u)),
    ),
  ];
  const avatarMap = new Map<string, string | null>();
  await Promise.all(
    uniqueAvatars.map(async (raw) => {
      avatarMap.set(raw, await resolveAvatarDisplayUrl(supabase, raw));
    }),
  );

  const people: SectionStaffAssignedPerson[] = [];
  for (const id of orderedIds) {
    const row = byId.get(id);
    if (!row) continue;
    const kind = leadId && id === leadId ? "lead" : "assistant";
    const avatarRaw = trimOrNull(row.avatar_url);
    people.push({
      id: row.id,
      label: formatProfileSnakeSurnameFirst(row),
      kind,
      role: row.role || (kind === "lead" ? "teacher" : "assistant"),
      phone: trimOrNull(row.phone),
      dniOrPassport: trimOrNull(row.dni_or_passport),
      email: emailById.get(id) ?? null,
      avatarDisplayUrl: avatarRaw ? (avatarMap.get(avatarRaw) ?? null) : null,
    });
  }
  return people;
}
