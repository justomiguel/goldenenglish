"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { adminActionDict } from "@/lib/i18n/actionErrors";
import { defaultLocale } from "@/lib/i18n/dictionaries";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const createSchema = z.object({
  locale: z.string().min(2),
  code: z.string().min(2).max(64),
  discountType: z.enum(["percent", "fixed_amount"]),
  discountValue: z.number().positive(),
  validFrom: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  maxUses: z.number().int().min(0).nullable().optional(),
});

export async function createDiscountCoupon(
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
  const validUntil =
    parsed.data.validUntil && parsed.data.validUntil.trim() !== ""
      ? new Date(parsed.data.validUntil).toISOString()
      : null;

  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("discount_coupons").insert({
      code,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountValue,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: parsed.data.maxUses ?? null,
      uses_count: 0,
      is_active: true,
    });
    if (error) {
      logSupabaseClientError("createDiscountCoupon", error, { code });
      return { ok: false, message: ae.saveFailed };
    }
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/coupons`);
    return { ok: true };
  } catch (err) {
    logServerException("createDiscountCoupon", err);
    return { ok: false, message: ae.forbidden };
  }
}

export async function toggleDiscountCoupon(
  locale: string,
  couponId: string,
  isActive: boolean,
): Promise<{ ok: boolean; message?: string }> {
  const ae = await adminActionDict(locale);
  const id = z.string().uuid().safeParse(couponId);
  if (!id.success) return { ok: false, message: ae.invalidId };
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase
      .from("discount_coupons")
      .update({ is_active: isActive })
      .eq("id", id.data);
    if (error) {
      logSupabaseClientError("toggleDiscountCoupon", error, { couponId: id.data });
      return { ok: false, message: ae.saveFailed };
    }
    revalidatePath(`/${locale}/dashboard/admin/coupons`);
    return { ok: true };
  } catch (err) {
    logServerException("toggleDiscountCoupon", err);
    return { ok: false, message: ae.forbidden };
  }
}
