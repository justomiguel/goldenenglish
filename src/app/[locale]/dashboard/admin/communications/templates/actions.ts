"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { isKnownEmailTemplateKey } from "@/lib/email/templates/templateRegistry";
import { sanitizeEmailTemplateHtml } from "@/lib/email/sanitizeEmailTemplateHtml";

export type EmailTemplateActionErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_input"
  | "unknown_template_key"
  | "persist_failed";

export type EmailTemplateActionResult =
  | { ok: true; updatedAt: string }
  | { ok: false; code: EmailTemplateActionErrorCode };

const SaveSchema = z.object({
  locale: z.string(),
  templateKey: z.string().min(1).max(120),
  templateLocale: z.enum(["es", "en"]),
  subject: z.string().trim().min(1).max(300),
  bodyHtml: z.string().trim().min(1).max(60_000),
});

export async function saveEmailTemplateAction(
  rawInput: unknown,
): Promise<EmailTemplateActionResult> {
  const parsed = SaveSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const input = parsed.data;
  if (!isKnownEmailTemplateKey(input.templateKey)) {
    return { ok: false, code: "unknown_template_key" };
  }

  /**
   * Sanitize at the persistence boundary (OWASP A03 / A08). Even though the
   * caller is supposed to be staff, we treat `body_html` as untrusted and
   * strip `<script>`, `on*` handlers, `javascript:` URLs, etc. before they
   * land in `email_templates` and get rendered into real outbound emails.
   * If the sanitizer reduces the body to nothing the input was effectively
   * all forbidden markup → reject as `invalid_input`.
   */
  const safeBodyHtml = sanitizeEmailTemplateHtml(input.bodyHtml);
  if (!safeBodyHtml.trim()) {
    return { ok: false, code: "invalid_input" };
  }

  try {
    const { supabase, user } = await assertAdmin();
    const upsert = await supabase
      .from("email_templates")
      .upsert(
        {
          template_key: input.templateKey,
          locale: input.templateLocale,
          subject: input.subject,
          body_html: safeBodyHtml,
          updated_by: user.id,
        },
        { onConflict: "template_key,locale" },
      )
      .select("updated_at")
      .single();

    if (upsert.error) {
      logSupabaseClientError("saveEmailTemplate:upsert", upsert.error, {
        templateKey: input.templateKey,
      });
      return { ok: false, code: "persist_failed" };
    }

    await recordSystemAudit({
      action: "email_template_updated",
      resourceType: "email_template",
      resourceId: `${input.templateKey}::${input.templateLocale}`,
      payload: {
        templateKey: input.templateKey,
        locale: input.templateLocale,
        subjectLength: input.subject.length,
        bodyLength: safeBodyHtml.length,
      },
    });

    revalidatePath(`/${input.locale}/dashboard/admin/communications/templates`);

    const updatedAt = (upsert.data as { updated_at: string } | null)?.updated_at ?? new Date().toISOString();
    return { ok: true, updatedAt };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) {
      logServerAuthzDenied("saveEmailTemplate:unauthorized");
      return { ok: false, code: "unauthorized" };
    }
    if (msg === ADMIN_SESSION_FORBIDDEN) {
      logServerAuthzDenied("saveEmailTemplate:forbidden");
      return { ok: false, code: "forbidden" };
    }
    logServerException("saveEmailTemplate", e, { input });
    return { ok: false, code: "persist_failed" };
  }
}

const ResetSchema = z.object({
  locale: z.string(),
  templateKey: z.string().min(1).max(120),
  templateLocale: z.enum(["es", "en"]),
});

export async function resetEmailTemplateAction(
  rawInput: unknown,
): Promise<EmailTemplateActionResult> {
  const parsed = ResetSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const input = parsed.data;
  if (!isKnownEmailTemplateKey(input.templateKey)) {
    return { ok: false, code: "unknown_template_key" };
  }

  try {
    const { supabase } = await assertAdmin();
    const del = await supabase
      .from("email_templates")
      .delete()
      .eq("template_key", input.templateKey)
      .eq("locale", input.templateLocale);
    if (del.error) {
      logSupabaseClientError("resetEmailTemplate:delete", del.error, {
        templateKey: input.templateKey,
      });
      return { ok: false, code: "persist_failed" };
    }

    await recordSystemAudit({
      action: "email_template_reset",
      resourceType: "email_template",
      resourceId: `${input.templateKey}::${input.templateLocale}`,
      payload: {
        templateKey: input.templateKey,
        locale: input.templateLocale,
      },
    });

    revalidatePath(`/${input.locale}/dashboard/admin/communications/templates`);
    return { ok: true, updatedAt: new Date().toISOString() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === ADMIN_SESSION_UNAUTHORIZED) return { ok: false, code: "unauthorized" };
    if (msg === ADMIN_SESSION_FORBIDDEN) return { ok: false, code: "forbidden" };
    logServerException("resetEmailTemplate", e, { input });
    return { ok: false, code: "persist_failed" };
  }
}
