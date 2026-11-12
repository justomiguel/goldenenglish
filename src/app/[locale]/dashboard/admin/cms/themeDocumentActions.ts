"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createThemeDocumentService } from "@/lib/theme-document/createThemeDocumentService";
import { writeVariantPins } from "@/lib/theme-document/server/writeVariantPins";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { pulsarThemeEditorContext } from "@/lib/pulsar/pulsarThemeEditorContext";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { SITE_THEME_ACTIVE_CACHE_TAG, siteThemeActiveCacheTagForTenant } from "@/types/theming";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { starterDocument } from "@/lib/theme-document/starterDocument";
import type { SkinLocale } from "@/lib/landing/skin/skinModel";

type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; path?: string };

async function openService(locale: string): Promise<
  { ok: true; service: ReturnType<typeof createThemeDocumentService>; slug: string } | { ok: false; code: string }
> {
  const pulsar = await pulsarThemeEditorContext();
  const session = pulsar ?? (await assertAdmin().catch(() => null));
  if (!session) return { ok: false, code: "forbidden" };
  const slug = getAlsTenant()?.slug?.trim();
  if (!slug) return { ok: false, code: "tenant_missing" };
  const service = createThemeDocumentService({
    client: session.supabase,
    tenantSlug: slug,
    actor: { id: session.user.id ?? "", role: pulsar ? "staff" : "admin" },
    pins: writeVariantPins,
  });
  return { ok: true, service, slug };
}

function refresh(locale: string, slug: string): void {
  updateTag(siteThemeActiveCacheTagForTenant(slug));
  updateTag(SITE_THEME_ACTIVE_CACHE_TAG);
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/dashboard/admin/cms`);
  revalidatePath(`/${locale}/dashboard/admin/cms/design`);
  revalidatePath(`/${locale}/admin/tenants/${slug}/theme/design`);
}

function skinLocale(locale: string): SkinLocale {
  if (locale === "en" || locale === "pt") return locale;
  return "es";
}

async function finish<T>(locale: string, slug: string, result: ActionResult<T>): Promise<ActionResult<T>> {
  if (result.ok) refresh(locale, slug);
  return result;
}

export async function saveThemeDraft(input: {
  locale: string;
  siteThemeId: string;
  document: unknown;
  baseHash: string | null;
}): Promise<ActionResult<{ hash: string }>> {
  const opened = await openService(input.locale);
  if (!opened.ok) return opened;
  return finish(input.locale, opened.slug, await opened.service.saveDraft(input));
}

export async function publishThemeDraft(input: {
  locale: string;
  siteThemeId: string;
  expectedHash: string;
}): Promise<ActionResult<{ id: string; version: number }>> {
  const opened = await openService(input.locale);
  if (!opened.ok) return opened;
  return finish(input.locale, opened.slug, await opened.service.publish(input));
}

export async function rollbackTheme(input: {
  locale: string;
  siteThemeId: string;
  snapshotId: string;
}): Promise<ActionResult<{ id: string; version: number }>> {
  const opened = await openService(input.locale);
  if (!opened.ok) return opened;
  return finish(input.locale, opened.slug, await opened.service.rollback(input));
}

export async function applyThemeStarterAction(input: {
  locale: string;
  siteThemeId: string;
  kind: string;
}): Promise<ActionResult<{ hash: string }>> {
  if (!isGenericInstituteKind(input.kind)) return { ok: false, code: "invalid_input" };
  const opened = await openService(input.locale);
  if (!opened.ok) return opened;
  const dict = await getDictionary(input.locale as AppLocale);
  const document = starterDocument(input.kind, dict, skinLocale(input.locale));
  return finish(
    input.locale,
    opened.slug,
    await opened.service.saveDraft({
      siteThemeId: input.siteThemeId,
      document,
      baseHash: null,
    }),
  );
}

export async function discardThemeDraft(input: {
  locale: string;
  siteThemeId: string;
}): Promise<ActionResult<null>> {
  const opened = await openService(input.locale);
  if (!opened.ok) return opened;
  return finish(input.locale, opened.slug, await opened.service.discard(input));
}
