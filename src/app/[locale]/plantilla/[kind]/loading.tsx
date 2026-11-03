import { TemplatePreviewLoader } from "@/components/molecules/TemplatePreviewLoader";
import { defaultLocale, getDictionary, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { headers } from "next/headers";

export default async function GenericTemplatePreviewLoading() {
  const header = (await headers()).get(GE_REQUEST_LOCALE_HEADER) ?? "";
  const locale = locales.includes(header as AppLocale) ? (header as AppLocale) : defaultLocale;
  const dict = await getDictionary(locale);
  return (
    <div className="min-h-screen">
      <TemplatePreviewLoader label={dict.pulsar.account.templatePreviewLoading} locale={locale} />
    </div>
  );
}
