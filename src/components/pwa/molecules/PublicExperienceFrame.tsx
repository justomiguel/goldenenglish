"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useInstalledDisplay } from "@/hooks/useAppSurface";
import type { Dictionary } from "@/types/i18n";
import {
  publicExperienceLocaleVariant,
  publicExperienceThemeClass,
  publicExperienceVariant,
  publicPwaCoursesHref,
  type PublicExperienceVariant,
} from "@/lib/theme/publicExperienceNav";
import type { LanguageSwitcherLabels } from "@/components/molecules/LanguageSwitcher";
import { PwaPullToRefresh } from "@/components/pwa/molecules/PwaPullToRefresh";
import { PublicInstalledTopBar } from "@/components/pwa/molecules/PublicInstalledTopBar";
import {
  PublicPwaTabBar,
  type PublicPwaTabBarProps,
} from "@/components/pwa/molecules/PublicPwaTabBar";

export interface PublicExperienceFrameProps extends PublicPwaTabBarProps {
  children: ReactNode;
  pullCopy: Dictionary["pwa"]["pullToRefresh"];
  variant?: PublicExperienceVariant;
  logoSrc: string;
  logoAlt: string;
  localeLabels: LanguageSwitcherLabels;
}

export function PublicExperienceFrame({
  children,
  pullCopy,
  variant = "default",
  logoSrc,
  logoAlt,
  localeLabels,
  locale,
  ...tabProps
}: PublicExperienceFrameProps) {
  const installed = useInstalledDisplay();
  const router = useRouter();
  const themeClass = publicExperienceThemeClass(variant);

  return (
    <div className={themeClass}>
      <PwaPullToRefresh
        copy={pullCopy}
        enabled={installed}
        onRefresh={() => router.refresh()}
      >
        <div className="public-installed-scroll pb-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] md:pb-0">
          {installed ? (
            <PublicInstalledTopBar
              homeHref={`/${locale}`}
              logoSrc={logoSrc}
              logoAlt={logoAlt}
              locale={locale}
              localeLabels={localeLabels}
              localeVariant={publicExperienceLocaleVariant(variant)}
            />
          ) : null}
          {children}
        </div>
      </PwaPullToRefresh>
      <PublicPwaTabBar {...tabProps} locale={locale} variant={variant} />
    </div>
  );
}

export interface PublicExperienceChromeProps {
  children: ReactNode;
  dict: Dictionary;
  locale: string;
  sessionEmail: string | null;
  templateKind: string;
  inscriptionsEnabled?: boolean;
  merchEnabled?: boolean;
  blogEnabled?: boolean;
  coursesLabel?: string;
  logoSrc: string;
  logoAlt: string;
}

/** Theme dock for a public page. Desktop hides the bar with `md:hidden`. */
export function PublicExperienceChrome({
  children,
  dict,
  locale,
  sessionEmail,
  templateKind,
  inscriptionsEnabled,
  merchEnabled,
  blogEnabled,
  coursesLabel,
  logoSrc,
  logoAlt,
}: PublicExperienceChromeProps) {
  const variant = publicExperienceVariant(templateKind);
  return (
    <PublicExperienceFrame
      locale={locale}
      sessionEmail={sessionEmail}
      variant={variant}
      coursesHref={publicPwaCoursesHref(templateKind, locale)}
      coursesLabel={coursesLabel ?? dict.nav.courses}
      labels={dict.nav.publicPwaBar}
      loginLabel={dict.nav.loginShort}
      portalLabel={dict.nav.myPortal}
      inscriptionsEnabled={inscriptionsEnabled}
      merchEnabled={merchEnabled}
      blogEnabled={blogEnabled}
      pullCopy={dict.pwa.pullToRefresh}
      logoSrc={logoSrc}
      logoAlt={logoAlt}
      localeLabels={dict.common.locale}
    >
      {children}
    </PublicExperienceFrame>
  );
}
