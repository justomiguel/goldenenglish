"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminActionDict } from "@/lib/i18n/actionErrors";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditFinanceAction } from "@/lib/audit";

const createSchema = z.object({
  locale: z.string().min(2),
  code: z.string().min(2).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  discountType: z.enum(["percent", "fixed_amount"]),
  discountValue: z.number().positive(),
  appliesTo: z.enum(["enrollment", "monthly", "both"]),
  monthlyDurationMonths: z.number().int().min(0).nullable().optional(),
  isStackable: z.boolean(),
  validFrom: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
  maxUses: z.number().int().min(0).nullable().optional(),
});

export async function createPromotion(
  raw: z.infer<typeof createSchema>,
): Promise<{ ok: boolean; message?: string }> {
  const ae = await adminActionDict(
    typeof raw?.locale === "string" && raw.locale.length >= 2 ? raw.locale : defaultLocale,
  );
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: ae.invalidData };

  if (parsed.data.discountType === "percent" && parsed.data.discountValue > 100) {
    return { ok: false, message: ae.percentOver100 };
  }

  const code = parsed.data.code.trim();
  if (!code) return { ok: false, message: ae.invalidCode };

  const validFrom = parsed.data.validFrom
    ? new Date(parsed.data.validFrom).toISOString()
    : new Date().toISOString();
  const expiresAt =
    parsed.data.expiresAt && parsed.data.expiresAt.trim() !== ""
      ? new Date(parsed.data.expiresAt).toISOString()
      : null;

  let monthlyDurationMonths: number | null = null;
  if (parsed.data.appliesTo === "monthly" || parsed.data.appliesTo === "both") {
    const m = parsed.data.monthlyDurationMonths;
    monthlyDurationMonths = m === undefined || m === null ? null : m;
  }

  try {
    const { supabase, user } = await assertAdmin();
    const afterValues = {
      code,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      applies_to: parsed.data.appliesTo,
      monthly_duration_months: monthlyDurationMonths,
      is_stackable: parsed.data.isStackable,
      max_uses: parsed.data.maxUses ?? null,
      uses_count: 0,
      valid_from: validFrom,
      expires_at: expiresAt,
      is_active: true,
      deleted_at: null,
    };
    const { error } = await supabase.from("promotions").insert({
      code,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      applies_to: parsed.data.appliesTo,
      monthly_duration_months: monthlyDurationMonths,
      is_stackable: parsed.data.isStackable,
      max_uses: parsed.data.maxUses ?? null,
      uses_count: 0,
      valid_from: validFrom,
      expires_at: expiresAt,
      is_active: true,
      deleted_at: null,
    });
    if (error) {
      logSupabaseClientError("createPromotion", error, { code });
      return { ok: false, message: ae.saveFailed };
    }
    void auditFinanceAction({
      actorId: user.id,
      actorRole: "admin",
      action: "create",
      resourceType: "promotion",
      resourceId: code,
      summary: "Admin created promotion",
      afterValues,
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/promotions`);
    return { ok: true };
  } catch (err) {
    logServerException("createPromotion", err);
    return { ok: false, message: ae.forbidden };
  }
}

export async function togglePromotionActive(
  locale: string,
  promotionId: string,
  isActive: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const ae = await adminActionDict(locale);
  const id = z.string().uuid().safeParse(promotionId);
  if (!id.success) return { ok: false, message: ae.invalidId };
  try {
    const { supabase, user } = await assertAdmin();
    const { data: beforePromotion } = await supabase
      .from("promotions")
      .select("id, code, name, is_active")
      .eq("id", id.data)
      .maybeSingle();
    const { error } = await supabase
      .from("promotions")
      .update({ is_active: isActive })
      .eq("id", id.data)
      .is("deleted_at", null);
    if (error) {
      logSupabaseClientError("togglePromotionActive", error, { promotionId: id.data });
      return { ok: false, message: ae.saveFailed };
    }
    void auditFinanceAction({
      actorId: user.id,
      actorRole: "admin",
      action: "update",
      resourceType: "promotion",
      resourceId: id.data,
      summary: `Admin ${isActive ? "activated" : "deactivated"} promotion`,
      beforeValues: {
        code: beforePromotion?.code ?? null,
        name: beforePromotion?.name ?? null,
        is_active: beforePromotion?.is_active ?? null,
      },
      afterValues: {
        code: beforePromotion?.code ?? null,
        name: beforePromotion?.name ?? null,
        is_active: isActive,
      },
    });
    revalidatePath(`/${locale}/dashboard/admin/promotions`);
    return { ok: true };
  } catch (err) {
    logServerException("togglePromotionActive", err);
    return { ok: false, message: ae.forbidden };
  }
}

export async function softDeletePromotion(
  locale: string,
  promotionId: string,
): Promise<{ ok: boolean; message?: string }> {
  const ae = await adminActionDict(locale);
  const id = z.string().uuid().safeParse(promotionId);
  if (!id.success) return { ok: false, message: ae.invalidId };
  try {
    const { supabase, user } = await assertAdmin();
    const { data: beforePromotion } = await supabase
      .from("promotions")
      .select("id, code, name, is_active, deleted_at")
      .eq("id", id.data)
      .maybeSingle();
    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from("promotions")
      .update({ deleted_at: deletedAt, is_active: false })
      .eq("id", id.data);
    if (error) {
      logSupabaseClientError("softDeletePromotion", error, { promotionId: id.data });
      return { ok: false, message: ae.saveFailed };
    }
    void auditFinanceAction({
      actorId: user.id,
      actorRole: "admin",
      action: "delete",
      resourceType: "promotion",
      resourceId: id.data,
      summary: "Admin soft-deleted promotion",
      beforeValues: {
        code: beforePromotion?.code ?? null,
        name: beforePromotion?.name ?? null,
        is_active: beforePromotion?.is_active ?? null,
        deleted_at: beforePromotion?.deleted_at ?? null,
      },
      afterValues: {
        code: beforePromotion?.code ?? null,
        name: beforePromotion?.name ?? null,
        is_active: false,
        deleted_at: deletedAt,
      },
    });
    revalidatePath(`/${locale}/dashboard/admin/promotions`);
    return { ok: true };
  } catch (err) {
    logServerException("softDeletePromotion", err);
    return { ok: false, message: ae.forbidden };
  }
}
