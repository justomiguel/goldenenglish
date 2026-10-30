import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LANDING_MEDIA_BUCKET } from "@/lib/cms/landingMediaBucket";
import { cleanThemeOverridesForPersistence } from "@/lib/cms/cleanThemeOverridesForPersistence";
import { parseSiteThemePropertyStrings } from "@/lib/cms/parseSiteThemePropertyStrings";
import { logServerActionException, logSupabaseError } from "@/lib/logging/serverActionLog";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { loadProperties } from "@/lib/theme/themeParser";
import { SITE_THEME_ACTIVE_CACHE_TAG, siteThemeActiveCacheTagForTenant } from "@/types/theming";
import {
  writeInstitutePublicImagePack,
  type InstituteImageBytes,
  type InstitutePublicImagePack,
} from "@/lib/tenant/institutePublicImagePack";

async function mirrorToStorage(
  supabase: SupabaseClient,
  files: InstitutePublicImagePack["files"],
): Promise<void> {
  for (const file of files) {
    const { error } = await supabase.storage
      .from(LANDING_MEDIA_BUCKET)
      .upload(`institute-public/${file.fileName}`, file.bytes, {
        contentType: file.contentType,
        upsert: true,
      });
    if (error) {
      logSupabaseError("institutePublicImages:mirror", error, { file: file.fileName });
    }
  }
}

/**
 * Builds `public/images/<slug>/` from the name, tagline, and files the admin saved.
 * Returns null when the theme is not a generic institute template.
 */
export async function publishInstitutePublicImages(args: {
  slug: string;
  themeId: string;
  themeKind: string;
  properties: unknown;
  name: string;
  description: string;
  supabase: SupabaseClient;
  locale: string;
  persist: boolean;
  replaceFaviconPath: boolean;
  logo?: InstituteImageBytes | null;
  favicon?: InstituteImageBytes | null;
  hero?: InstituteImageBytes | null;
}): Promise<InstitutePublicImagePack | null> {
  if (!isGenericInstituteKind(args.themeKind)) return null;
  try {
    const pack = writeInstitutePublicImagePack({
      root: process.cwd(),
      slug: args.slug,
      name: args.name,
      description: args.description,
      kind: args.themeKind,
      faviconMode: parseSiteThemePropertyStrings(args.properties)["app.favicon.mode"] === "letter"
        ? "letter"
        : "image",
      logo: args.logo,
      favicon: args.favicon,
      hero: args.hero,
    });
    await mirrorToStorage(args.supabase, pack.files);
    if (!args.persist) return pack;

    const flat = parseSiteThemePropertyStrings(args.properties);
    if (pack.logoPath) flat["app.logo.path"] = pack.logoPath;
    if (args.replaceFaviconPath) flat["app.favicon.path"] = pack.faviconPath;
    flat["app.share.image"] = pack.sharePath;
    const cleaned = cleanThemeOverridesForPersistence(loadProperties(), flat);
    const { error } = await args.supabase
      .from("site_themes")
      .update({ properties: cleaned })
      .eq("id", args.themeId);
    if (error) {
      logSupabaseError("institutePublicImages:theme", error, { slug: args.slug });
      return pack;
    }
    updateTag(SITE_THEME_ACTIVE_CACHE_TAG);
    updateTag(siteThemeActiveCacheTagForTenant(args.slug));
    revalidatePath(`/${args.locale}`);
    return pack;
  } catch (err) {
    logServerActionException("publishInstitutePublicImages", err, { slug: args.slug });
    return null;
  }
}

/** Uses the saved name and tagline. Skips themes that are not generic. */
export async function publishGenericInstituteUpload(args: {
  slug: string | null | undefined;
  theme: { id: string; name: string; template_kind: unknown; properties: unknown };
  supabase: SupabaseClient;
  locale: string;
  replaceFaviconPath: boolean;
  persist?: boolean;
  logo?: InstituteImageBytes | null;
  favicon?: InstituteImageBytes | null;
  hero?: InstituteImageBytes | null;
}): Promise<InstitutePublicImagePack | null> {
  const kind = String(args.theme.template_kind);
  if (!args.slug || !isGenericInstituteKind(kind)) return null;
  const flat = parseSiteThemePropertyStrings(args.theme.properties);
  return publishInstitutePublicImages({
    slug: args.slug,
    themeId: args.theme.id,
    themeKind: kind,
    properties: args.theme.properties,
    name: flat["app.name"] || args.theme.name,
    description: flat["app.tagline"] || "",
    supabase: args.supabase,
    locale: args.locale,
    persist: args.persist ?? false,
    replaceFaviconPath: args.replaceFaviconPath,
    logo: args.logo,
    favicon: args.favicon,
    hero: args.hero,
  });
}
