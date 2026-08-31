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
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export interface RegisterLioraSurfaceProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  legalAgeMajority: number;
  sectionOptions: { id: string; label: string }[];
  enrollmentLink?: SectionEnrollmentLinkContext;
  extrasPack?: "nago" | null;
  intent?: RegisterIntent;
}

export function RegisterLioraSurface({
  locale,
  dict,
  brand,
  legalAgeMajority,
  sectionOptions,
  enrollmentLink,
  extrasPack = null,
  intent = "reserve",
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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 md:gap-10 md:pt-14">
        <aside>
          <div className="liora-card p-6 md:p-8">
            <p className="liora-kicker text-[var(--liora-rose-deep)]">
              {t("hero.kicker")}
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-liora-display)] text-3xl font-light leading-tight tracking-[0.08em] text-[var(--liora-ink)] md:text-4xl">
              {t("hero.title")}
            </h2>
            <p className="mt-3 text-lg font-light text-[var(--liora-rose-deep)]">
              {t("hero.subtitle")}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--liora-ink-soft)]">
              {t("sobreNosotros.bodyP1")}
            </p>
            <ul className="mt-6 grid gap-3 border-t border-[var(--liora-line)] pt-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
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
          <header className="mb-6 text-center md:mb-8 md:text-left">
            <h1 className="font-[family-name:var(--font-liora-display)] text-3xl font-light tracking-[0.08em] text-[var(--liora-ink)] md:text-4xl">
              {intent === "trial" ? dict.register.trial.shellTitle : liora.register.shellTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[var(--liora-ink-soft)] md:mx-0 md:text-lg">
              {liora.register.shellLead}
            </p>
          </header>
          <div className="liora-public-sheet liora-card w-full p-1">
            <RegisterForm
              locale={locale}
              dict={dict.register}
              legalAgeMajority={legalAgeMajority}
              sectionOptions={sectionOptions}
              enrollmentLink={enrollmentLink}
              extrasPack={extrasPack}
              intent={intent}
            />
          </div>
          <p className="mt-8 flex justify-center md:justify-start">
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
