import type { Metadata } from "next";
import {
  getDictionary,
  defaultLocale,
  locales,
} from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { ForgotPasswordScreenGate } from "@/components/organisms/ForgotPasswordScreenGate";

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
  const brand = getBrandPublic();

  return <ForgotPasswordScreenGate brand={brand} dict={dict} locale={locale} />;
}
