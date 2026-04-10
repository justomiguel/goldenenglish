import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";
import { RegisterForm } from "@/components/register/RegisterForm";
import { RegisterCollage } from "@/components/molecules/RegisterCollage";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";

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
  const brand = getBrandPublic();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-muted)] px-4 py-10 md:py-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(55vh,520px)] -z-10 bg-[radial-gradient(ellipse_90%_80%_at_50%_-10%,color-mix(in_srgb,var(--color-accent)_16%,transparent)_0%,transparent_65%)] opacity-90"
        aria-hidden
      />
      <RegisterSiteHeader brand={brand} locale={locale} dict={dict} />

      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start lg:gap-12 xl:gap-16">
        <header className="text-center lg:col-span-2">
          <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)] md:text-4xl">
            {dict.register.title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-muted-foreground)] md:text-lg">
            {dict.register.lead}
          </p>
        </header>

        <RegisterCollage alts={dict.landing.collage.alts} />

        <div className="w-full max-w-lg justify-self-center lg:max-w-none lg:justify-self-stretch">
          <RegisterForm locale={locale} dict={dict.register} />
          <p className="mt-8 text-center text-sm lg:text-left">
            <Link
              href={`/${locale}/login`}
              className="text-[var(--color-primary)] underline decoration-[var(--color-primary)]/35 underline-offset-2 transition hover:decoration-[var(--color-primary)]"
            >
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
