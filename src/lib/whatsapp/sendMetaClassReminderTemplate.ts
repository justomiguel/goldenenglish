import { preferTenantValue } from "@/lib/tenant/preferTenantValue";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

/**
 * Meta WhatsApp Cloud API — transactional template (body parameters only).
 * Requires WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_CLASS_REMINDER_TEMPLATE_NAME.
 */

export type SendMetaClassReminderTemplateResult =
  | { ok: true }
  | { ok: false; code: "whatsapp_not_configured" | "whatsapp_http_error" | "whatsapp_api_error" };

export async function sendMetaClassReminderTemplate(input: {
  /** E.164 including + */
  toE164: string;
  /** Ordered body variable strings for the approved template */
  bodyParameters: string[];
}): Promise<SendMetaClassReminderTemplateResult> {
  const tenant = await resolveRequestTenant();
  const token = preferTenantValue(tenant?.whatsappAccessToken, process.env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = preferTenantValue(
    tenant?.whatsappPhoneNumberId,
    process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
  const templateName = preferTenantValue(
    tenant?.whatsappClassReminderTemplateName,
    process.env.WHATSAPP_CLASS_REMINDER_TEMPLATE_NAME,
  );
  if (!token || !phoneNumberId || !templateName) {
    return { ok: false, code: "whatsapp_not_configured" };
  }

  const to = input.toE164.replace(/^\+/, "").replace(/\D/g, "");
  if (to.length < 8) {
    return { ok: false, code: "whatsapp_api_error" };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: input.bodyParameters.map((text) => ({
                type: "text",
                text: text.slice(0, 1024),
              })),
            },
          ],
        },
      }),
    });
  } catch {
    return { ok: false, code: "whatsapp_http_error" };
  }

  if (!res.ok) {
    return { ok: false, code: "whatsapp_api_error" };
  }
  return { ok: true };
}
