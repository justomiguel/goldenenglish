import type { Metadata } from "next";
import {
  getDictionary,
  defaultLocale,
  locales,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrand } from "@/lib/brand/resolvePublicBrand";
import { ForgotPasswordScreenGate } from "@/components/organisms/ForgotPasswordScreenGate";
import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const canonical = `/${locale}/forgot-password`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `/${loc}/forgot-password`;
  }
  languages["x-default"] = `/${defaultLocale}/forgot-password`;

  return {
    title: dict.forgotPassword.title,
    description: dict.forgotPassword.subtitle,
    alternates: { canonical, languages },
    robots: { index: false, follow: false },
  };
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await resolvePublicBrand(locale as AppLocale);
  const snapshot = await loadActiveTheme();

  return (
    <PublicTenantChrome templateKind={snapshot?.theme.templateKind ?? "classic"}>
      <ForgotPasswordScreenGate brand={brand} dict={dict} locale={locale} />
    </PublicTenantChrome>
  );
}
