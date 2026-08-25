import type { SupabaseClient } from "@supabase/supabase-js";
import type { Dictionary } from "@/types/i18n";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { splitTutorDisplayName } from "@/lib/register/tutorDisplayNameParts";
import {
  ensureParentProfileByTutorDni,
  upsertTutorStudentLink,
} from "@/lib/register/ensureParentProfileByTutorDni";
import { failAfterStudentCreated } from "@/lib/register/acceptRegistrationHelpers";
import { localizeRegistrationAcceptError } from "@/lib/register/localizeRegistrationAcceptError";

export async function createAcceptedStudentWithOptionalTutor(input: {
  admin: SupabaseClient;
  dict: Dictionary;
  locale: string;
  registrationId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  birth: string;
  isMinor: boolean;
  tutorDni: string;
  tutorNameRaw: string;
  tutorEmail: string | null;
  tutorPhone: string | null;
  tutorRelationship: string | null;
}): Promise<{ ok: true; studentId: string } | { ok: false; message: string }> {
  const createRes = await createDashboardUser({
    email: input.email,
    password: input.password,
    role: "student",
    first_name: input.firstName,
    last_name: input.lastName,
    dni_or_passport: input.dni,
    phone: input.phone,
    birth_date: input.birth,
    locale: input.locale,
    provisioning_route: "registration_accept",
  });

  if (!createRes.ok) {
    const msg =
      "message" in createRes && createRes.message != null
        ? createRes.message
        : localizeRegistrationAcceptError(input.dict, "save_failed");
    return { ok: false, message: msg };
  }
  const studentId = createRes.userId;
  if (!studentId) {
    return { ok: false, message: localizeRegistrationAcceptError(input.dict, "no_user_returned") };
  }

  if (!input.isMinor) return { ok: true, studentId };

  const { firstName: tf, lastName: tl } = splitTutorDisplayName(input.tutorNameRaw, {
    defaultFirstName: input.dict.admin.registrations.tutorAccountDefaultFirst,
    emptyLastName: input.dict.admin.registrations.emptyValue,
  });
  const parentRes = await ensureParentProfileByTutorDni(input.admin, {
    tutorDniRaw: input.tutorDni,
    tutorEmail: input.tutorEmail,
    tutorPhone: input.tutorPhone,
    tutorFirstName: tf,
    tutorLastName: tl,
  });
  if (!parentRes.ok) {
    return failAfterStudentCreated(
      input.admin,
      input.registrationId,
      studentId,
      parentRes.message,
      input.dict,
      parentRes.incidentRef,
    );
  }
  const linkRes = await upsertTutorStudentLink(
    input.admin,
    parentRes.parentId,
    studentId,
    input.tutorRelationship,
  );
  if (!linkRes.ok) {
    return failAfterStudentCreated(
      input.admin,
      input.registrationId,
      studentId,
      linkRes.message ?? "link_failed",
      input.dict,
    );
  }
  return { ok: true, studentId };
}
