import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";
import { createAdminClient } from "@/lib/supabase/admin";

function formatDate(locale: string, iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

export async function loadAdminUserDetail(
  rawUserId: string,
  locale: string,
  emptyDisplay = "—",
): Promise<AdminUserDetailVM | null> {
  const idParsed = z.string().uuid().safeParse(rawUserId);
  if (!idParsed.success) return null;

  try {
    await assertAdmin();
  } catch {
    return null;
  }

  const userId = idParsed.data;
  const admin = createAdminClient();
  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
  if (authErr || !authData.user) return null;

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select(
      "first_name, last_name, role, phone, dni_or_passport, birth_date, age_years, assigned_teacher_id, avatar_url, created_at",
    )
    .eq("id", userId)
    .single();

  if (pErr || !profile) return null;

  let assignedTeacherName: string | null = null;
  if (profile.assigned_teacher_id) {
    const { data: t } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", profile.assigned_teacher_id)
      .single();
    assignedTeacherName = t ? `${t.first_name} ${t.last_name}`.trim() : null;
  }

  const avatarDisplayUrl = await resolveAvatarUrlForAdmin(admin, profile.avatar_url);

  const phone = profile.phone?.trim() ? profile.phone.trim() : emptyDisplay;
  const birthDateDisplay = formatDate(locale, profile.birth_date);
  const createdAtDisplay = formatDate(locale, profile.created_at) ?? emptyDisplay;

  return {
    email: authData.user.email ?? emptyDisplay,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
    phone,
    dniOrPassport: profile.dni_or_passport,
    birthDateDisplay,
    ageYears: profile.age_years,
    assignedTeacherName,
    createdAtDisplay,
    avatarDisplayUrl,
  };
}
