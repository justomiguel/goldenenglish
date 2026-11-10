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
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { PwaPullToRefresh } from "@/components/pwa/molecules/PwaPullToRefresh";
import { PublicInstalledTopBar } from "@/components/pwa/molecules/PublicInstalledTopBar";
import {
  PublicPwaTabBar,
  type PublicPwaTabBarProps,
} from "@/components/pwa/molecules/PublicPwaTabBar";

const OWN_HEADER_VARIANTS: ReadonlySet<PublicExperienceVariant> = new Set(["liora"]);

export interface PublicExperienceFrameProps extends PublicPwaTabBarProps {
  children: ReactNode;
  pullCopy: Dictionary["pwa"]["pullToRefresh"];
  variant?: PublicExperienceVariant;
  logoSrc: string;
  logoAlt: string;
  localeLabels: LanguageSwitcherLabels;
  showTabBar?: boolean;
}

export function PublicExperienceFrame({
  children,
  pullCopy,
  variant = "default",
  logoSrc,
  logoAlt,
  localeLabels,
  locale,
  showTabBar = true,
  ...tabProps
}: PublicExperienceFrameProps) {
  const installed = useInstalledDisplay();
  const router = useRouter();
  const themeClass = publicExperienceThemeClass(variant);
  // Liora renders its own sticky header with safe-area padding; a second bar would stack.
  const showInstalledTopBar = installed && !OWN_HEADER_VARIANTS.has(variant);

  return (
    <div className={themeClass}>
      <PwaPullToRefresh
        copy={pullCopy}
        enabled={installed}
        onRefresh={() => router.refresh()}
      >
        <div
          className={
            showTabBar
              ? "public-installed-scroll pb-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] md:pb-0"
              : "public-installed-scroll"
          }
        >
          {showInstalledTopBar ? (
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
      {showTabBar ? <PublicPwaTabBar {...tabProps} locale={locale} variant={variant} /> : null}
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

/** The tab uses the theme's own section name when the landing has one. */
function themedCoursesLabel(dict: Dictionary, templateKind: string): string {
  if (templateKind === "liora") {
    const label = marketingLandingCopy(dict, "liora", "nav.clases").trim();
    if (label) return label;
  }
  return dict.nav.courses;
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
      coursesLabel={coursesLabel ?? themedCoursesLabel(dict, templateKind)}
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
      showTabBar={!isGenericInstituteKind(templateKind)}
    >
      {children}
    </PublicExperienceFrame>
  );
}
