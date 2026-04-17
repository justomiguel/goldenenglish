import Image from "next/image";
import Link from "next/link";
import { LifeBuoy, Mail, RefreshCw, UserRound } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { SignOutButton } from "@/components/molecules/SignOutButton";

export interface ProfileMissingScreenProps {
  locale: string;
  brand: BrandPublic;
  labels: Dictionary["dashboard"]["myProfile"];
}

const signOutPrimaryClass =
  "w-full min-h-[48px] justify-center gap-2 rounded-2xl bg-[var(--color-secondary)] px-5 py-3 text-base font-bold text-[var(--color-secondary-foreground)] shadow-sm transition hover:bg-[var(--color-secondary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]";

const homeSecondaryClass =
  "w-full min-h-[48px] justify-center rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-base font-semibold text-[var(--color-primary)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2";

export function ProfileMissingScreen({ locale, brand, labels }: ProfileMissingScreenProps) {
  const homeHref = `/${locale}`;
  const supportEmail = brand.contactEmail?.trim() ?? "";
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");
  const mailHref =
    supportEmail.length > 0
      ? `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(labels.profileMissingMailSubject)}`
      : null;

  return (
    <div className="dashboard-profile-shell relative min-h-dvh overflow-hidden">
      <main className="relative z-[1] mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-4 py-12 sm:px-6 md:px-8">
        <article
          className="dashboard-profile-missing-card relative mx-auto w-full max-w-lg p-8 sm:max-w-xl sm:p-10"
          aria-labelledby="profile-missing-title"
        >
          <header className="flex flex-col items-center text-center">
            <div className="mb-6 flex flex-col items-center gap-4">
              <Link
                href={homeHref}
                className="group rounded-2xl outline-none ring-offset-2 ring-offset-[var(--color-surface)] transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-sm transition group-hover:border-[var(--color-primary)]">
                  <Image
                    src={brand.logoPath}
                    alt={brand.logoAlt || brand.name}
                    width={72}
                    height={72}
                    unoptimized={bypassLogoOptimizer}
                    className="block h-16 w-16 rounded-xl object-contain sm:h-[4.5rem] sm:w-[4.5rem]"
                  />
                </div>
              </Link>
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-primary)]"
                aria-hidden
              >
                <UserRound className="h-7 w-7" strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
              {labels.profileMissingKicker}
            </p>
            <h1
              id="profile-missing-title"
              className="mt-3 max-w-md font-display text-2xl font-bold leading-tight tracking-tight text-[var(--color-primary)] sm:text-3xl"
            >
              {labels.profileMissingTitle}
            </h1>
            <p className="mt-4 max-w-md text-pretty text-sm leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
              {labels.profileMissingLead}
            </p>
          </header>

          <div className="mt-10 border-t border-[var(--color-border)] pt-8">
            <h2 className="text-center font-display text-lg font-bold text-[var(--color-secondary)]">
              {labels.profileMissingTryTitle}
            </h2>
            <ol className="mt-6 space-y-5">
              <li className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 sm:p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                  aria-hidden
                >
                  <RefreshCw className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-bold text-[var(--color-primary)]">{labels.profileMissingStep1Title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {labels.profileMissingStep1Body}
                  </p>
                </div>
              </li>
              <li className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)] p-4 sm:p-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]"
                  aria-hidden
                >
                  <LifeBuoy className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="font-bold text-[var(--color-secondary)]">{labels.profileMissingStep2Title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {labels.profileMissingStep2Body}
                  </p>
                  {mailHref ? (
                    <a
                      href={mailHref}
                      className="mt-4 inline-flex min-h-[44px] max-w-full flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-bold text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)]"
                    >
                      <span
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-primary)]"
                        aria-hidden
                      >
                        <Mail className="h-4 w-4" strokeWidth={2.25} />
                      </span>
                      <span className="text-balance">
                        {labels.profileMissingMailCta}
                        <span className="ml-1 font-medium text-[var(--color-muted-foreground)]">
                          ({supportEmail})
                        </span>
                      </span>
                    </a>
                  ) : null}
                </div>
              </li>
            </ol>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <SignOutButton
              locale={locale}
              label={labels.profileMissingSignOutCta}
              className={signOutPrimaryClass}
            />
            <Link href={homeHref} className={homeSecondaryClass}>
              {labels.profileMissingHomeCta}
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
