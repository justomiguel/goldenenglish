import { getDictionary } from "@/lib/i18n/dictionaries";
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
