import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import type { StudentEnrollmentRenewalKind } from "@/lib/student/studentEnrollmentRenewalNotice";

export interface StudentEnrollmentRenewalBannerProps {
  locale: string;
  kind: StudentEnrollmentRenewalKind;
  dict: Dictionary["dashboard"]["student"]["enrollmentRenewal"];
}

export function StudentEnrollmentRenewalBanner({ locale, kind, dict }: StudentEnrollmentRenewalBannerProps) {
  if (kind === "none") return null;
  const href = `/${locale}/dashboard/student/billing`;
  const body = kind === "missing_paid" ? dict.missingBody : dict.staleBody;

  return (
    <section
      role="region"
      aria-label={dict.title}
      className="mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-accent)] bg-[var(--color-surface)] p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{dict.title}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{body}</p>
      <Link
        href={href}
        className="mt-3 inline-flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)]"
      >
        {dict.cta}
      </Link>
    </section>
  );
}
