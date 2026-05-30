import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getDictionary,
  type AppLocale,
} from "@/lib/i18n/dictionaries";
import { resolvePublicBrandWithSetup } from "@/lib/brand/resolvePublicBrand";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { applyLandingContentOverrides } from "@/lib/cms/applyLandingContentOverrides";
import { buildLandingMediaMap } from "@/lib/cms/resolveLandingMedia";
import { createLandingMediaPublicUrlBuilder } from "@/lib/cms/landingMediaPublicUrl";
import { PublicBlogScreenClassic } from "@/components/organisms/PublicBlogScreenClassic";
import { PublicBlogScreenEspacioZenit } from "@/components/organisms/PublicBlogScreenEspacioZenit";
import { PublicBlogScreenMozarthitos } from "@/components/organisms/PublicBlogScreenMozarthitos";
import { PublicBlogScreenNago } from "@/components/organisms/PublicBlogScreenNago";
import { PublicBlogScreenMiMundo } from "@/components/organisms/PublicBlogScreenMiMundo";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
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

  const [{ brand, needsInitialSiteSetup, dict: baseDict }, snapshot, blogEnabled] =
    await Promise.all([
      resolvePublicBrandWithSetup(loc),
      loadActiveTheme(),
      loadBlogEnabled(),
    ]);

  const dict = needsInitialSiteSetup
    ? baseDict
    : applyLandingContentOverrides(baseDict, snapshot?.theme.content, loc);

  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const mediaMap = snapshot
    ? buildLandingMediaMap(snapshot.media, createLandingMediaPublicUrlBuilder())
    : undefined;

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
    blogLabel,
    eventsLabel,
    children,
  };

  if (templateKind === "espaciozenit") {
    return <PublicBlogScreenEspacioZenit {...shellProps} mediaMap={mediaMap} />;
  }
  if (templateKind === "mozarthitos") {
    return <PublicBlogScreenMozarthitos {...shellProps} mediaMap={mediaMap} />;
  }
  if (templateKind === "nago") {
    return <PublicBlogScreenNago {...shellProps} />;
  }
  if (templateKind === "mimundo") {
    return <PublicBlogScreenMiMundo {...shellProps} mediaMap={mediaMap} />;
  }

  return <PublicBlogScreenClassic {...shellProps} />;
}
