"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import {
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { isSectionEnrollmentLinkToken } from "@/lib/register/sectionEnrollmentLink";

export type SectionEnrollmentLinkActionState = { ok: boolean; message?: string };

const DENIED: SectionEnrollmentLinkActionState = { ok: false, message: "forbidden" };
const FAILED: SectionEnrollmentLinkActionState = { ok: false, message: "failed" };

/**
 * Section staff and admins may manage the link. Writes go through the service-role
 * client only after this gate passes — the link table has no grants for browser roles.
 */
async function authorize(
  sectionId: string,
  scope: string,
): Promise<{ userId: string } | null> {
  if (!isSectionEnrollmentLinkToken(sectionId)) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    logServerAuthzDenied(scope, { reason: "no_session" });
    return null;
  }

  const leads = await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId);
  if (leads) return { userId: user.id };

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (isAdmin) return { userId: user.id };

  logServerAuthzDenied(scope, { reason: "not_section_staff", section_id: sectionId });
  return null;
}

/**
 * Creates the link row or replaces its token, activating it either way. Generate and
 * rotate are the same write: rotate simply runs when a row already exists.
 */
async function upsertLink(
  scope: string,
  sectionId: string,
  userId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("section_enrollment_links").upsert(
    {
      section_id: sectionId,
      token: randomUUID(),
      is_active: true,
      created_by: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "section_id" },
  );
  if (error) {
    logSupabaseClientError(scope, error, { section_id: sectionId });
    return false;
  }
  return true;
}

async function setLinkActive(
  scope: string,
  sectionId: string,
  active: boolean,
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("section_enrollment_links")
    .update({ is_active: active, updated_at: new Date().toISOString() })
    .eq("section_id", sectionId);
  if (error) {
    logSupabaseClientError(scope, error, { section_id: sectionId });
    return false;
  }
  return true;
}

function refresh(locale: string, sectionId: string): void {
  revalidatePath(`/${locale}/dashboard/teacher/sections/${sectionId}`, "page");
  revalidatePath(`/${locale}/dashboard/teacher/sections`, "page");
  // Admin section detail also hosts the panel; without this, rotate/deactivate
  // leave a stale URL in the admin browser until a full navigation.
  revalidatePath(`/${locale}/dashboard/admin/academic`, "layout");
}

export async function generateSectionEnrollmentLinkAction(
  locale: string,
  sectionId: string,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "generateSectionEnrollmentLinkAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await upsertLink(scope, sectionId, auth.userId))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}

export async function setSectionEnrollmentLinkActiveAction(
  locale: string,
  sectionId: string,
  active: boolean,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "setSectionEnrollmentLinkActiveAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await setLinkActive(scope, sectionId, active === true))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}

export async function rotateSectionEnrollmentLinkAction(
  locale: string,
  sectionId: string,
): Promise<SectionEnrollmentLinkActionState> {
  const scope = "rotateSectionEnrollmentLinkAction";
  const auth = await authorize(sectionId, scope);
  if (!auth) return DENIED;

  if (!(await upsertLink(scope, sectionId, auth.userId))) return FAILED;

  refresh(locale, sectionId);
  return { ok: true };
}
