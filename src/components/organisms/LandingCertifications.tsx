import { Award, Building2, GraduationCap } from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";
import type { BrandPublic } from "@/lib/brand/server";

const bandArticle =
  "group relative overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-left shadow-[var(--shadow-soft)] transition duration-300 hover:border-[var(--color-primary)]/25 hover:shadow-[var(--shadow-card)]";

interface LandingCertificationsProps {
  dict: Dictionary;
  brand: BrandPublic;
}

const stroke = 1.75;

export function LandingCertifications({
  dict,
  brand,
}: LandingCertificationsProps) {
  const items: {
    title: string;
    body: string;
    extra?: string;
    Icon: typeof Building2;
  }[] = [
    {
      title: "Formosa",
      body: dict.landing.certs.edu,
      extra: brand.legalRegistry,
      Icon: Building2,
    },
    { title: "UTN", body: dict.landing.certs.utn, Icon: GraduationCap },
    { title: "Cambridge", body: dict.landing.certs.cambridge, Icon: Award },
  ];

  return (
    <LandingSection
      title={dict.landing.certs.title}
      className="bg-[var(--color-muted)]"
    >
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
        {items.map(({ title, body, extra, Icon: CertIcon }) => (
          <article key={title} className={bandArticle}>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/8 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/10">
              <CertIcon
                className="h-3.5 w-3.5 shrink-0 opacity-85"
                aria-hidden
                strokeWidth={stroke}
              />
              {title}
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {body}
            </p>
            {extra ? (
              <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-xs leading-snug text-[var(--color-muted-foreground)]">
                {extra}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
