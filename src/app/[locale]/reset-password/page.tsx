import type { Metadata } from "next";
import {
  getDictionary,
  defaultLocale,
  locales,
} from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { ResetPasswordScreenGate } from "@/components/organisms/ResetPasswordScreenGate";

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const canonical = `/${locale}/reset-password`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `/${loc}/reset-password`;
  }
  languages["x-default"] = `/${defaultLocale}/reset-password`;

  return {
    title: dict.resetPassword.title,
    description: dict.resetPassword.subtitle,
    alternates: { canonical, languages },
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = getBrandPublic();

  return <ResetPasswordScreenGate brand={brand} dict={dict} locale={locale} />;
}
