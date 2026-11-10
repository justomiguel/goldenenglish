"use client";

import { MatissSiteHeader } from "@/components/organisms/MatissSiteHeader";
import { LandingMatissPhoneSections } from "@/components/organisms/LandingMatissPhoneSections";
import { LandingMatissSections } from "@/components/organisms/LandingMatissSections";
import { useMatissCompactLayout } from "@/hooks/useMatissCompactLayout";
import type { LandingMatissSectionsProps } from "@/lib/landing/buildMatissLanding";

export interface LandingMatissExperienceProps extends LandingMatissSectionsProps {
  sessionEmail: string | null;
  openMenu: string;
  closeMenu: string;
}

export function LandingMatissExperience({
  sessionEmail,
  openMenu,
  closeMenu,
  brand,
  locale,
  dict,
  links,
  ...sections
}: LandingMatissExperienceProps) {
  const compact = useMatissCompactLayout();
  const header = (
    <MatissSiteHeader
      locale={locale}
      brandName={brand.name}
      logoAlt={brand.logoAlt}
      dict={dict}
      sessionEmail={sessionEmail}
      links={links}
      openMenu={openMenu}
      closeMenu={closeMenu}
      placement={compact ? "fixed" : "sticky"}
    />
  );
  const body = { dict, brand, locale, links, ...sections };

  if (compact === null) {
    return <div className="min-h-dvh bg-[var(--matiss-paper)]" aria-busy="true" />;
  }

  if (compact) {
    return (
      <main className="relative h-dvh overflow-hidden">
        {header}
        <LandingMatissPhoneSections {...body} />
      </main>
    );
  }

  return (
    <main className="relative overflow-x-clip">
      {header}
      <LandingMatissSections {...body} />
    </main>
  );
}
