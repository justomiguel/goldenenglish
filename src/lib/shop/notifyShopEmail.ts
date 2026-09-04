import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { Locale } from "@/types/i18n";
import type { ShopEmailKey } from "@/lib/email/templates/registryShop";

function asLocale(value: string | undefined): Locale {
  if (value === "en" || value === "pt") return value;
  return "es";
}

/** Failed send is logged and must not roll back the order or Auth user. */
export async function notifyShopEmail(input: {
  to: string;
  key: ShopEmailKey;
  vars?: Record<string, string>;
  locale?: string;
}): Promise<void> {
  try {
    const result = await sendBrandedEmail({
      to: input.to,
      templateKey: input.key,
      locale: asLocale(input.locale),
      vars: input.vars,
    });
    if (!result.ok) {
      logServerException("notifyShopEmail", new Error(result.error), { key: input.key });
    }
  } catch (err) {
    logServerException("notifyShopEmail", err, { key: input.key });
  }
}
