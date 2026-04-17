"use server";

import { randomUUID } from "node:crypto";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  addLandingBlockInputSchema,
  moveLandingBlockInputSchema,
  removeLandingBlockInputSchema,
  setSiteThemeKindInputSchema,
  updateLandingBlockInputSchema,
} from "@/lib/cms/siteThemeBlocksInputSchemas";
import {
  moveLandingBlock,
  parseLandingBlocks,
  sanitizeLandingBlocksForPersistence,
} from "@/lib/cms/landingBlocksCatalog";
import type { LandingBlock } from "@/types/theming";
import {
  fetchSiteThemeById,
  resolveAdminContext,
  revalidateSiteThemeSurfaces,
  type SiteThemeActionResult,
} from "./siteThemeActionShared";

/**
 * CRUD para subsecciones dinámicas (PR 6).
 *
 * Cada acción carga la fila, parsea sus `blocks`, aplica la mutación,
 * sanea + cap-checks vía `sanitizeLandingBlocksForPersistence` y persiste el
 * array completo. La operación es atómica al nivel del template (un solo
 * UPDATE), lo que evita carreras cuando el admin agrega/edita rápido.
 */

function persistAndAudit(
  action: string,
  themeId: string,
  blocks: ReadonlyArray<LandingBlock>,
  locale: string,
) {
  return async (
    supabase: import("@supabase/supabase-js").SupabaseClient,
    userId: string,
    payload: Record<string, unknown>,
  ): Promise<SiteThemeActionResult> => {
    const { error } = await supabase
      .from("site_themes")
      .update({ blocks, updated_by: userId })
      .eq("id", themeId);
    if (error) {
      logSupabaseError(`siteThemeBlocksActions:${action}`, error);
      return { ok: false, code: "persist_failed" };
    }
    void recordSystemAudit({
      action: "site_theme_blocks_updated",
      resourceType: "site_theme",
      resourceId: themeId,
      payload: { ...payload, op: action, count: blocks.length },
    });
    revalidateSiteThemeSurfaces(locale);
    return { ok: true, id: themeId };
  };
}

export async function addLandingBlockAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = addLandingBlockInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const current = parseLandingBlocks(existing.blocks);
  const newBlock: LandingBlock = {
    id: randomUUID(),
    section: parsed.data.section,
    kind: parsed.data.kind,
    position: current.filter((b) => b.section === parsed.data.section).length,
    copy: {
      es: parsed.data.copy.es,
      en: parsed.data.copy.en,
    },
  };
  const next = [...current, newBlock];
  const sanitized = sanitizeLandingBlocksForPersistence(next);
  if (!sanitized.ok) return { ok: false, code: "invalid_input" };

  const persist = persistAndAudit(
    "add",
    parsed.data.id,
    sanitized.blocks,
    parsed.data.locale,
  );
  return persist(admin.supabase, admin.user.id, {
    section: parsed.data.section,
    blockId: newBlock.id,
  });
}

export async function updateLandingBlockAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = updateLandingBlockInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const current = parseLandingBlocks(existing.blocks);
  const target = current.find((b) => b.id === parsed.data.blockId);
  if (!target) return { ok: false, code: "not_found" };

  const updated = current.map((block) =>
    block.id === target.id
      ? {
          ...block,
          copy: { es: parsed.data.copy.es, en: parsed.data.copy.en },
        }
      : block,
  );
  const sanitized = sanitizeLandingBlocksForPersistence(updated);
  if (!sanitized.ok) return { ok: false, code: "invalid_input" };

  const persist = persistAndAudit(
    "update",
    parsed.data.id,
    sanitized.blocks,
    parsed.data.locale,
  );
  return persist(admin.supabase, admin.user.id, {
    section: target.section,
    blockId: target.id,
  });
}

export async function removeLandingBlockAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = removeLandingBlockInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const current = parseLandingBlocks(existing.blocks);
  const target = current.find((b) => b.id === parsed.data.blockId);
  if (!target) return { ok: true, id: parsed.data.id };

  const next = current.filter((b) => b.id !== target.id);
  const sanitized = sanitizeLandingBlocksForPersistence(next);
  if (!sanitized.ok) return { ok: false, code: "invalid_input" };

  const persist = persistAndAudit(
    "remove",
    parsed.data.id,
    sanitized.blocks,
    parsed.data.locale,
  );
  return persist(admin.supabase, admin.user.id, {
    section: target.section,
    blockId: target.id,
  });
}

export async function moveLandingBlockAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = moveLandingBlockInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const current = parseLandingBlocks(existing.blocks);
  const target = current.find((b) => b.id === parsed.data.blockId);
  if (!target) return { ok: false, code: "not_found" };

  const next = moveLandingBlock(current, parsed.data.blockId, parsed.data.direction);
  const sanitized = sanitizeLandingBlocksForPersistence(next);
  if (!sanitized.ok) return { ok: false, code: "invalid_input" };

  const persist = persistAndAudit(
    "move",
    parsed.data.id,
    sanitized.blocks,
    parsed.data.locale,
  );
  return persist(admin.supabase, admin.user.id, {
    section: target.section,
    blockId: target.id,
    direction: parsed.data.direction,
  });
}

export async function setSiteThemeKindAction(
  raw: unknown,
): Promise<SiteThemeActionResult> {
  const ctx = await resolveAdminContext();
  if (!ctx.ok) return { ok: false, code: ctx.code };
  const parsed = setSiteThemeKindInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const { admin } = ctx;
  const existing = await fetchSiteThemeById(admin.supabase, parsed.data.id);
  if (!existing) return { ok: false, code: "not_found" };

  const { error } = await admin.supabase
    .from("site_themes")
    .update({ template_kind: parsed.data.kind, updated_by: admin.user.id })
    .eq("id", parsed.data.id);
  if (error) {
    logSupabaseError("siteThemeBlocksActions:setKind", error);
    return { ok: false, code: "persist_failed" };
  }

  void recordSystemAudit({
    action: "site_theme_kind_updated",
    resourceType: "site_theme",
    resourceId: parsed.data.id,
    payload: { kind: parsed.data.kind },
  });
  revalidateSiteThemeSurfaces(parsed.data.locale);
  return { ok: true, id: parsed.data.id };
}
