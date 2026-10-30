"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { loadBillingCurrencySetting } from "@/lib/billing/loadBillingCurrencySetting";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";
import { courseParentPayAllowed, courseSelfPayAllowed, type CourseBuyerRole } from "@/lib/courses/courseBuyerEligibility";
import { startCourseGatewayPayment } from "@/lib/courses/startCourseGatewayPayment";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadPaymentGatewayEncryptionKeyRaw32 } from "@/lib/payment-gateways/loadPaymentGatewayEncryptionKey";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import {
  logServerActionException,
  logServerAuthzDenied,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import type { ShopCheckoutGateway } from "@/lib/shop/types";

const Schema = z.object({
  locale: z.string().min(2).max(8),
  slug: z.string().trim().min(1).max(120),
  studentId: z.string().uuid().optional(),
  gateway: z.enum(["flow", "mercadopago"]).optional(),
});

export type EnrollCourseResult =
  | { ok: true; redirectUrl?: string }
  | { ok: false; code: "unauthorized" | "invalid_input" | "not_found" | "minor" | "missing_birth_date" | "not_student" | "not_linked" | "no_gateway" | "persist_failed" };

function buyerRole(role: string): CourseBuyerRole {
  if (role === "student") return "student";
  if (role === "parent" || role === "tutor") return "parent";
  return "other";
}

export async function enrollPublicCourseAction(raw: unknown): Promise<EnrollCourseResult> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, code: "unauthorized" };

    const admin = await createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, birth_date")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError || !profile) {
      logSupabaseClientError("enrollPublicCourse:profile", profileError, {});
      return { ok: false, code: "persist_failed" };
    }

    const role = buyerRole(String(profile.role ?? ""));
    const { data: course, error: courseError } = await admin
      .from("learning_courses")
      .select("id, title, price, status, listed_in_shop")
      .eq("slug", parsed.data.slug)
      .maybeSingle();
    if (courseError || !course || course.status !== "published" || !course.listed_in_shop) {
      if (courseError) logSupabaseClientError("enrollPublicCourse:course", courseError, {});
      return { ok: false, code: "not_found" };
    }

    const studentId = await resolveStudentId(admin, user.id, role, profile.birth_date, parsed.data.studentId);
    if (!studentId.ok) return studentId;

    const price = Number(course.price);
    if (price <= 0) {
      const granted = await grantPurchase(admin, studentId.studentId, String(course.id));
      if (!granted) return { ok: false, code: "persist_failed" };
      await recordUserEventServer({
        userId: user.id,
        eventType: "action",
        entity: `course:${course.id}:enroll`,
        metadata: { course_id: course.id, price: 0 },
      });
      revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
      return { ok: true, redirectUrl: `/${parsed.data.locale}/dashboard/student/progress?tab=courses` };
    }

    const gateway = parsed.data.gateway;
    if (!gateway) return { ok: false, code: "no_gateway" };
    return startPaid({
      admin,
      locale: parsed.data.locale,
      gateway,
      buyerId: user.id,
      buyerEmail: user.email ?? "",
      studentId: studentId.studentId,
      courseId: String(course.id),
      title: String(course.title),
      price,
    });
  } catch (error) {
    logServerActionException("enrollPublicCourseAction", error);
    return { ok: false, code: "persist_failed" };
  }
}

type StudentTarget =
  | { ok: true; studentId: string }
  | { ok: false; code: "minor" | "not_student" | "missing_birth_date" | "not_linked" | "persist_failed" };

async function resolveStudentId(
  admin: Awaited<ReturnType<typeof createAdminClient>>,
  buyerId: string,
  role: CourseBuyerRole,
  birthDate: string | null,
  requestedStudentId: string | undefined,
): Promise<StudentTarget> {
  if (role === "student") {
    const allowed = courseSelfPayAllowed({
      role,
      birthDate,
      legalAgeMajority: getLegalAgeMajorityFromSystem(),
    });
    if (!allowed.ok) return allowed;
    return { ok: true, studentId: buyerId };
  }
  if (!courseParentPayAllowed(role) || !requestedStudentId) {
    logServerAuthzDenied("enrollPublicCourse:role", { role });
    return { ok: false, code: "not_student" };
  }
  const { data, error } = await admin
    .from("tutor_student_rel")
    .select("student_id")
    .eq("tutor_id", buyerId)
    .eq("student_id", requestedStudentId)
    .maybeSingle();
  if (error) {
    logSupabaseClientError("enrollPublicCourse:ward", error, {});
    return { ok: false, code: "persist_failed" };
  }
  if (!data) return { ok: false, code: "not_linked" };
  return { ok: true, studentId: requestedStudentId };
}

async function grantPurchase(admin: Awaited<ReturnType<typeof createAdminClient>>, studentId: string, courseId: string) {
  const { error } = await admin.from("student_course_grants").upsert(
    { student_id: studentId, course_id: courseId, source: "purchase" },
    { onConflict: "student_id,course_id" },
  );
  if (error) {
    logSupabaseClientError("enrollPublicCourse:grant", error, { courseId });
    return false;
  }
  return true;
}

async function startPaid(input: {
  admin: Awaited<ReturnType<typeof createAdminClient>>;
  locale: string;
  gateway: ShopCheckoutGateway;
  buyerId: string;
  buyerEmail: string;
  studentId: string;
  courseId: string;
  title: string;
  price: number;
}): Promise<EnrollCourseResult> {
  let rawKey;
  try {
    rawKey = await loadPaymentGatewayEncryptionKeyRaw32();
  } catch (error) {
    logServerActionException("enrollPublicCourse:key", error);
    return { ok: false, code: "no_gateway" };
  }
  const { currency } = await loadBillingCurrencySetting(input.admin);
  const { data: order, error } = await input.admin
    .from("course_orders")
    .insert({
      buyer_id: input.buyerId,
      student_id: input.studentId,
      course_id: input.courseId,
      amount: input.price,
      currency,
      status: "pending",
      pay_token: randomBytes(24).toString("hex"),
    })
    .select("id")
    .single();
  if (error || !order) {
    logSupabaseClientError("enrollPublicCourse:order", error, { courseId: input.courseId });
    return { ok: false, code: "persist_failed" };
  }
  const started = await startCourseGatewayPayment({
    admin: input.admin,
    encryptionKey32: rawKey,
    gateway: input.gateway,
    locale: input.locale,
    amount: input.price,
    title: input.title,
    payerEmail: input.buyerEmail,
    orderId: order.id,
  });
  if (!started.ok) return started;
  return { ok: true, redirectUrl: started.redirectUrl };
}
