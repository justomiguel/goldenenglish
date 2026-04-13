import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";

/** Resolves locale from a `FormData` field posted by clients (hidden `locale`). */
export function localeFromFormData(formData: FormData): string {
  const raw = String(formData.get("locale") ?? "").trim();
  return raw || defaultLocale;
}

export async function paymentActionDict(formData: FormData) {
  const dict = await getDictionary(localeFromFormData(formData));
  return dict.actionErrors.payment;
}

export async function adminActionDict(locale: string) {
  const dict = await getDictionary(locale || defaultLocale);
  return dict.actionErrors.admin;
}

export async function billingUploadActionDict(formData: FormData) {
  const dict = await getDictionary(localeFromFormData(formData));
  return dict.actionErrors.billingUpload;
}
