import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { RegisterForm } from "@/components/register/RegisterForm";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale } = await params;
  if (!(await getInscriptionsEnabled())) {
    redirect(`/${locale}`);
  }

  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-[var(--color-muted)] px-4 py-10">
      <div className="mx-auto mb-8 flex max-w-lg justify-end">
        <LanguageSwitcher locale={locale} labels={dict.common.locale} />
      </div>
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">
          {dict.register.title}
        </h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{dict.register.lead}</p>
      </div>
      <div className="mt-8">
        <RegisterForm locale={locale} dict={dict.register} />
      </div>
      <p className="mx-auto mt-8 max-w-lg text-center text-sm">
        <Link href={`/${locale}/login`} className="text-[var(--color-primary)] underline">
          {dict.login.title}
        </Link>
      </p>
    </div>
  );
}
