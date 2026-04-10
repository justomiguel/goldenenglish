import type { Metadata } from "next";
import {
  getDictionary,
  defaultLocale,
  locales,
} from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { LoginScreenDesktop } from "@/components/desktop/organisms/LoginScreenDesktop";
import { LoginScreenGate } from "@/components/organisms/LoginScreenGate";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ next?: string | string[] }>;
}

function pickNextParam(
  sp: Record<string, string | string[] | undefined> | undefined,
): string | null {
  const v = sp?.next;
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return null;
}

export async function generateMetadata({
  params,
}: Pick<LoginPageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const canonical = `/${locale}/login`;
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `/${loc}/login`;
  }
  languages["x-default"] = `/${defaultLocale}/login`;

  return {
    title: dict.login.title,
    description: dict.login.subtitle,
    alternates: { canonical, languages },
    openGraph: {
      title: dict.login.title,
      description: dict.login.subtitle,
      url: canonical,
    },
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = pickNextParam(sp);
  const dict = await getDictionary(locale);
  const brand = getBrandPublic();

  return (
    <LoginScreenGate
      brand={brand}
      dict={dict}
      locale={locale}
      nextPath={nextPath}
      desktop={
        <LoginScreenDesktop
          brand={brand}
          dict={dict}
          locale={locale}
          nextPath={nextPath}
        />
      }
    />
  );
}
