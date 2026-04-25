import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import type { AdminUserDetailVM, AdminUserTutorLinkVM } from "@/lib/dashboard/adminUserDetailVM";
import { resolveAvatarUrlForAdmin } from "@/lib/dashboard/resolveAvatarUrl";
import {
  loadAdminStudentCurrentCohortAssignment,
  type AdminStudentCurrentCohortAssignment,
} from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";

function formatDate(locale: string, iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(d);
}

async function loadTutorLinksForStudent(
  admin: SupabaseClient,
  studentId: string,
  emptyDisplay: string,
): Promise<AdminUserTutorLinkVM[]> {
  const { data: rels, error } = await admin.from("tutor_student_rel").select("tutor_id").eq("student_id", studentId);
  if (error) {
    logSupabaseClientError("loadTutorLinksForStudent:tutor_student_rel", error, { studentId });
    return [];
  }
  if (!rels?.length) return [];
  const tutorIds = [...new Set(rels.map((r) => String(r.tutor_id)))];
  const out: AdminUserTutorLinkVM[] = [];
  for (const tutorId of tutorIds) {
    const [{ data: tp }, { data: authT }] = await Promise.all([
      admin.from("profiles").select("first_name, last_name").eq("id", tutorId).maybeSingle(),
      admin.auth.admin.getUserById(tutorId),
    ]);
    const name = tp ? `${tp.first_name ?? ""} ${tp.last_name ?? ""}`.trim() : "";
    const em = authT?.user?.email?.trim() ?? "";
    out.push({
      tutorId,
      displayName: name.length > 0 ? name : emptyDisplay,
      emailDisplay: em.length > 0 ? em : emptyDisplay,
    });
  }
  return out;
}

export async function loadAdminUserDetail(
  rawUserId: string,
  locale: string,
  emptyDisplay = "—",
  viewerMayInlineEdit = false,
  includeStudentAcademicContext = true,
): Promise<AdminUserDetailVM | null> {
  const idParsed = z.string().uuid().safeParse(rawUserId);
  if (!idParsed.success) return null;

  try {
    await assertAdmin();
  } catch {
    logServerAuthzDenied("loadAdminUserDetail");
    return null;
  }

  const userId = idParsed.data;
  const admin = createAdminClient();
  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
  if (authErr) {
    logSupabaseClientError("loadAdminUserDetail:authGetUserById", authErr, { userId });
    return null;
  }
  if (!authData.user) return null;

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select(
      "first_name, last_name, role, phone, dni_or_passport, birth_date, age_years, assigned_teacher_id, avatar_url, created_at, is_minor",
    )
    .eq("id", userId)
    .single();

  if (pErr) {
    logSupabaseClientError("loadAdminUserDetail:profilesSelect", pErr, { userId });
    return null;
  }
  if (!profile) return null;

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

  const phoneRaw = (profile.phone ?? "").trim();
  const phoneDisplay = phoneRaw.length > 0 ? phoneRaw : emptyDisplay;
  const birthDateDisplay = formatDate(locale, profile.birth_date);
  const createdAtDisplay = formatDate(locale, profile.created_at) ?? emptyDisplay;
  const emailRaw = (authData.user.email ?? "").trim();
  const emailDisplay = emailRaw.length > 0 ? emailRaw : emptyDisplay;
  const birthIso =
    profile.birth_date != null && String(profile.birth_date).length >= 10
      ? String(profile.birth_date).slice(0, 10)
      : null;

  const role = String(profile.role ?? "");
  let tutorLinks: AdminUserTutorLinkVM[] = [];
  let currentCohortAssignment: AdminStudentCurrentCohortAssignment | null = null;
  if (role === "student" && includeStudentAcademicContext) {
    [tutorLinks, currentCohortAssignment] = await Promise.all([
      loadTutorLinksForStudent(admin, userId, emptyDisplay),
      loadAdminStudentCurrentCohortAssignment(admin, userId),
    ]);
  } else if (role === "student") {
    tutorLinks = await loadTutorLinksForStudent(admin, userId, emptyDisplay);
  }

  return {
    userId,
    email: emailRaw,
    emailDisplay,
    firstName: String(profile.first_name ?? ""),
    lastName: String(profile.last_name ?? ""),
    role,
    phone: phoneRaw,
    phoneDisplay,
    dniOrPassport: String(profile.dni_or_passport ?? ""),
    birthDateIso: birthIso,
    birthDateDisplay,
    ageYears: profile.age_years,
    isMinor: profile.is_minor === true,
    assignedTeacherName,
    createdAtDisplay,
    avatarDisplayUrl,
    tutorLinks,
    currentCohortAssignment,
    viewerMayInlineEdit,
  };
}
