"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  ensureParentProfileByTutorDni,
  upsertTutorStudentLink,
  type EnsureParentReuseKind,
} from "@/lib/register/ensureParentProfileByTutorDni";
import { TUTOR_STUDENT_RELATIONSHIP_CODES } from "@/lib/register/tutorStudentRelationship";
import {
  logServerAuthzDenied,
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const S = "adminUserDetailTutorCreateActions";

export type CreateAdminParentAndLinkStudentActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string }
  | {
      ok: false;
      needsConfirmation: true;
      reuseKind: Exclude<EnsureParentReuseKind, "created">;
      existingProfileId: string;
    };

const localeZ = z.string().min(2).max(8);
const uuidZ = z.string().uuid();

const tutorRelationshipSchema = z.enum(
  TUTOR_STUDENT_RELATIONSHIP_CODES as unknown as [string, ...string[]],
);

const createLinkSchema = z.object({
  locale: localeZ,
  studentId: uuidZ,
  tutorDni: z.string().min(1).max(64),
  tutorFirstName: z.string().min(1).max(120),
  tutorLastName: z.string().min(1).max(120),
  tutorEmail: z.union([z.string().email().max(320), z.literal("")]),
  tutorPhone: z.string().max(40).optional(),
  relationship: tutorRelationshipSchema,
  /** Staff acknowledged linking to an existing profile resolved by DNI (must match server recomputed id). */
  confirmReuseOfProfileId: uuidZ.optional(),
});

export async function createAdminParentAndLinkStudentAction(
  raw: unknown,
): Promise<CreateAdminParentAndLinkStudentActionResult> {
  let locale: AppLocale = defaultLocale;
  try {
    const parsed = createLinkSchema.safeParse(raw);
    if (!parsed.success) {
      const dict = await getDictionary(defaultLocale);
      const relErr = parsed.error.flatten().fieldErrors.relationship;
      if (relErr?.length) {
        return { ok: false, message: dict.admin.users.detailErrTutorRelationshipRequired };
      }
      return { ok: false, message: dict.admin.users.detailErrInvalid };
    }
    locale = locales.includes(parsed.data.locale as AppLocale) ? (parsed.data.locale as AppLocale) : defaultLocale;
    const dict = await getDictionary(locale);
    const L = dict.admin.users;
    try {
      await assertAdmin();
    } catch {
      logServerAuthzDenied(`${S}:createParentLink`);
      return { ok: false, message: L.detailErrForbidden };
    }

    const {
      studentId,
      tutorDni,
      tutorFirstName,
      tutorLastName,
      tutorEmail,
      tutorPhone,
      relationship,
      confirmReuseOfProfileId,
    } = parsed.data;

    const admin = createAdminClient();
    const { data: stu, error: stuErr } = await admin.from("profiles").select("role").eq("id", studentId).single();
    if (stuErr || !stu || String(stu.role) !== "student") {
      return { ok: false, message: L.detailErrSave };
    }

    const ensured = await ensureParentProfileByTutorDni(admin, {
      tutorDniRaw: tutorDni,
      tutorEmail: tutorEmail.trim() ? tutorEmail.trim() : null,
      tutorPhone: tutorPhone?.trim() ? tutorPhone : null,
      tutorFirstName: tutorFirstName.trim(),
      tutorLastName: tutorLastName.trim(),
    });
    if (!ensured.ok) {
      const code = ensured.message;
      if (code === "tutor_dni_required") return { ok: false, message: L.detailTutorCreateErrDniRequired };
      if (code === "tutor_dni_in_use_by_student") return { ok: false, message: L.detailTutorCreateErrDniStudent };
      if (code === "auth_failed" || code === "no_user_returned") return { ok: false, message: L.detailTutorCreateErrAuth };
      return { ok: false, message: L.detailErrSave };
    }

    if (studentId === ensured.parentId) {
      return { ok: false, message: L.detailErrTutorSelf };
    }

    if (ensured.reuseKind !== "created") {
      const ack = confirmReuseOfProfileId;
      if (!ack || ack !== ensured.parentId) {
        return {
          ok: false,
          needsConfirmation: true,
          reuseKind: ensured.reuseKind,
          existingProfileId: ensured.parentId,
        };
      }
    }

    const linkRes = await upsertTutorStudentLink(admin, ensured.parentId, studentId, relationship);
    if (!linkRes.ok) {
      logSupabaseClientError(`${S}:tutorUpsertAfterCreate`, { message: linkRes.message ?? "link_failed" }, {
        studentId,
        parentId: ensured.parentId,
      });
      return { ok: false, message: L.detailErrSave };
    }

    void recordSystemAudit({
      action: "admin_user_detail_create_parent_link",
      resourceType: "tutor_student_rel",
      resourceId: studentId,
      payload: { parentId: ensured.parentId, reuseKind: ensured.reuseKind, relationship },
    });
    revalidatePath(`/${locale}/dashboard/admin/users/${studentId}`);
    revalidatePath(`/${locale}/dashboard/admin/users/${ensured.parentId}`);
    revalidatePath(`/${locale}/dashboard/admin/users`);

    const okMessage =
      ensured.reuseKind === "created"
        ? L.detailToastTutorCreatedLinked
        : ensured.reuseKind === "reused_admin"
          ? L.detailToastTutorLinkedReusedAdmin
          : L.detailToastTutorLinkedReusedParent;

    return { ok: true, message: okMessage };
  } catch (e) {
    logServerActionException(S, e, { op: "createParentLink" });
    const dict = await getDictionary(locale);
    return { ok: false, message: dict.admin.users.detailErrSave };
  }
}
