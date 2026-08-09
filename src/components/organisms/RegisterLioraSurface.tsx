import Link from "next/link";
import { LogIn } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentLinkContext } from "@/lib/register/sectionEnrollmentLink";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { RegisterForm } from "@/components/register/RegisterForm";
import { LioraRegisterHeader } from "@/components/molecules/LioraRegisterHeader";
import { LioraFontRoot } from "@/components/organisms/LioraFontRoot";
import { LIORA_SEDE_KEYS } from "@/lib/landing/lioraSchedule";

export interface RegisterLioraSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
}

export function RegisterLioraSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
}: RegisterLioraSurfaceProps) {
  const prefix = `/${locale}`;
  const t = (path: string) => marketingLandingCopy(dict, "liora", path);
  const liora = dict.landing.liora;

  return (
    <LioraFontRoot className="relative min-h-screen pb-16">
      <LioraRegisterHeader
        locale={locale}
        logoSrc={brand.logoPath.trim()}
        logoAlt={brand.logoAlt || brand.name}
        dict={dict}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
        <aside className="hidden lg:block lg:pt-2">
          <div className="liora-card p-8">
            <p className="liora-kicker text-[var(--liora-rose-deep)]">
              {t("hero.kicker")}
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-liora-display)] text-4xl font-light leading-tight tracking-[0.08em] text-[var(--liora-ink)]">
              {t("hero.title")}
            </h2>
            <p className="mt-4 text-lg font-light text-[var(--liora-rose-deep)]">
              {t("hero.subtitle")}
            </p>
            <p className="mt-6 text-sm leading-relaxed text-[var(--liora-ink-soft)]">
              {t("sobreNosotros.bodyP1")}
            </p>
            <ul className="mt-7 space-y-3 border-t border-[var(--liora-line)] pt-6 text-sm">
              {LIORA_SEDE_KEYS.map((sedeKey) => (
                <li key={sedeKey}>
                  <span className="block font-medium tracking-wide text-[var(--liora-ink)]">
                    {t(`sedes.${sedeKey}.name`)}
                  </span>
                  <span className="block text-[var(--liora-ink-soft)]">
                    {t(`sedes.${sedeKey}.metro`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="w-full min-w-0">
          <header className="mb-8 text-center lg:mb-10 lg:text-left">
            <h1 className="font-[family-name:var(--font-liora-display)] text-3xl font-light tracking-[0.08em] text-[var(--liora-ink)] md:text-4xl">
              {liora.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[var(--liora-ink-soft)] md:text-lg lg:mx-0">
              {liora.register.shellLead}
            </p>
          </header>
          <div className="flex justify-center lg:justify-start">
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
              enrollmentLink={enrollmentLink}
            />
          </div>
          <p className="mt-8 flex justify-center lg:justify-start">
            <Link
              href={`${prefix}/login`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--liora-rose-deep)] underline decoration-[var(--liora-rose-deep)]/35 underline-offset-[0.35em] transition hover:decoration-[var(--liora-rose-deep)]"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
              {dict.login.title}
            </Link>
          </p>
        </div>
      </div>
    </LioraFontRoot>
  );
}
