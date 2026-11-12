import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { PublicBlogScreenClassic } from "@/components/organisms/PublicBlogScreenClassic";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";
import { renderOwnedSurface } from "@/variants/ownedSurfaces";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

interface PublicBlogPageShellProps {
  locale: string;
  children: ReactNode;
}

export async function PublicBlogPageShell({ locale, children }: PublicBlogPageShellProps) {
  const loc = locale as AppLocale;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const sessionEmail = user?.email ?? null;

  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot, blogEnabled, merchEnabled] =
    await Promise.all([
      resolvePublicBrandWithSetup(loc),
      loadActiveTheme(),
      loadBlogEnabled(),
      loadMerchEnabled(),
    ]);

  const dict = needsInitialSiteSetup
    ? baseDict
    : applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);

  const templateKind = snapshot?.theme.templateKind ?? "classic";

  const blogLabel = dict.blog.list.title;
  const eventsLabel =
    templateKind === "nago"
      ? marketingLandingCopy(dict, "nago", "nav.eventos")
      : dict.events.public.title;
  const shellProps = {
    locale,
    dict,
    brand,
    sessionEmail,
    blogEnabled,
    merchEnabled,
    blogLabel,
    eventsLabel,
    children,
  };

  const ownedBlog = renderOwnedSurface("blog", templateKind, shellProps);
  const screen = ownedBlog ?? <PublicBlogScreenClassic {...shellProps} />;

  return (
    <PublicExperienceShell
      locale={locale}
      dict={dict}
      templateKind={templateKind}
      sessionEmail={sessionEmail}
    >
      {screen}
    </PublicExperienceShell>
  );
}
