import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";
import { documentHash, isDocumentTooLarge } from "@/lib/theme-document/canonicalDocument";
import { findLockedFieldEdits } from "@/lib/theme-document/findLockedFieldEdits";
import { themeDocumentV1Schema, type ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { validateThemeDocument } from "@/lib/theme-document/validateThemeDocument";
import { logServerWarn } from "@/lib/logging/serverActionLog";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; code: string; path?: string };

type DraftRow = { id: string; document: unknown; document_hash: string; version: number };

async function fail(scope: string, code: string, path?: string): Promise<ServiceResult<never>> {
  await logServerWarn(scope, { code, ...(path ? { path } : {}) });
  return path ? { ok: false, code, path } : { ok: false, code };
}

function rpcCode(message: string): string | null {
  for (const code of ["draft_missing", "document_stale", "snapshot_not_found", "forbidden"] as const) {
    if (message.includes(code)) return code;
  }
  return null;
}

async function oneRow(
  client: SupabaseClient,
  column: "site_theme_id" | "id",
  value: string,
  status?: string,
): Promise<DraftRow | null> {
  let query = client.from("theme_documents").select("id, document, document_hash, version").eq(column, value);
  if (status) query = query.eq("status", status);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as DraftRow | null;
}

function sectionsOf(doc: ThemeDocumentV1): ThemeSection[] {
  const nested = Object.values(doc.pages).flatMap((page) => page?.sections ?? []);
  return [...doc.sections, ...nested];
}

export function createThemeDocumentService(deps: {
  client: SupabaseClient;
  tenantSlug: string;
  actor: { id: string; role: "staff" | "admin" };
  pins: (slug: string, sections: ThemeSection[]) => Promise<void>;
}) {
  const { client, tenantSlug, actor, pins } = deps;

  async function saveDraft(input: {
    siteThemeId: string;
    document: unknown;
    baseHash: string | null;
  }): Promise<ServiceResult<{ hash: string }>> {
    const parsed = themeDocumentV1Schema.safeParse(input.document);
    if (!parsed.success) {
      return fail("themeDocument.save", "variant_props_invalid", parsed.error.issues[0]?.path.join("."));
    }
    if (isDocumentTooLarge(parsed.data)) return fail("themeDocument.save", "document_too_large");
    const current = await oneRow(client, "site_theme_id", input.siteThemeId, "draft");
    if ((current?.document_hash ?? null) !== input.baseHash) return fail("themeDocument.save", "document_stale");
    const previous = themeDocumentV1Schema.safeParse(current?.document);
    const baseline = previous.success ? previous.data : { ...parsed.data, editableBy: {} };
    const locked = findLockedFieldEdits(baseline, parsed.data, actor.role);
    if (locked[0]) return fail("themeDocument.save", "field_locked", locked[0]);
    const hash = await documentHash(parsed.data);
    if (current) {
      const updated = await client.from("theme_documents").update({ document: parsed.data, document_hash: hash }).eq("id", current.id);
      if (updated.error) return fail("themeDocument.save", "persist_failed");
    } else {
      const inserted = await client.from("theme_documents").insert({
        site_theme_id: input.siteThemeId,
        status: "draft",
        version: 0,
        document: parsed.data,
        document_hash: hash,
        created_by: actor.id || null,
      });
      if (inserted.error) return fail("themeDocument.save", "persist_failed");
    }
    return { ok: true, data: { hash } };
  }

  async function publish(input: {
    siteThemeId: string;
    expectedHash: string;
  }): Promise<ServiceResult<{ id: string; version: number }>> {
    const current = await oneRow(client, "site_theme_id", input.siteThemeId, "draft");
    const parsed = themeDocumentV1Schema.safeParse(current?.document);
    if (!current || !parsed.success) return fail("themeDocument.publish", "draft_missing");
    const issues = validateThemeDocument(parsed.data, tenantSlug);
    if (!issues.ok) return fail("themeDocument.publish", issues.issues[0]?.code ?? "token_missing", issues.issues[0]?.path);
    const rpc = await client.rpc("publish_theme_document", {
      p_site_theme_id: input.siteThemeId,
      p_expected_hash: input.expectedHash,
    });
    if (rpc.error) return fail("themeDocument.publish", rpcCode(rpc.error.message) ?? "persist_failed");
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    try {
      await pins(tenantSlug, sectionsOf(parsed.data));
    } catch {
      await logServerWarn("themeDocument.pins", { code: "pins_write_failed" });
    }
    await recordSystemAudit({
      action: "theme_document.publish",
      resourceType: "theme_document",
      resourceId: String(row?.id ?? current.id),
      payload: { version: Number(row?.version ?? 0), documentHash: current.document_hash, changedPaths: 0 },
    });
    return { ok: true, data: { id: String(row?.id ?? current.id), version: Number(row?.version ?? 0) } };
  }

  async function rollback(input: {
    siteThemeId: string;
    snapshotId: string;
  }): Promise<ServiceResult<{ id: string; version: number }>> {
    const source = await oneRow(client, "id", input.snapshotId);
    const parsed = themeDocumentV1Schema.safeParse(source?.document);
    if (!source || !parsed.success) return fail("themeDocument.rollback", "snapshot_not_found");
    const rpc = await client.rpc("rollback_theme_document", {
      p_site_theme_id: input.siteThemeId,
      p_snapshot_id: input.snapshotId,
    });
    if (rpc.error) return fail("themeDocument.rollback", rpcCode(rpc.error.message) ?? "persist_failed");
    const row = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    try {
      await pins(tenantSlug, sectionsOf(parsed.data));
    } catch {
      await logServerWarn("themeDocument.pins", { code: "pins_write_failed" });
    }
    await recordSystemAudit({
      action: "theme_document.rollback",
      resourceType: "theme_document",
      resourceId: String(row?.id ?? source.id),
      payload: { version: Number(row?.version ?? 0), documentHash: source.document_hash, changedPaths: 0 },
    });
    return { ok: true, data: { id: String(row?.id ?? source.id), version: Number(row?.version ?? 0) } };
  }

  async function discard(input: { siteThemeId: string }): Promise<ServiceResult<null>> {
    const current = await oneRow(client, "site_theme_id", input.siteThemeId, "draft");
    if (!current) return fail("themeDocument.save", "draft_missing");
    const removed = await client.from("theme_documents").delete().eq("id", current.id).eq("status", "draft");
    if (removed.error) return fail("themeDocument.save", "persist_failed");
    await recordSystemAudit({
      action: "theme_document.discard",
      resourceType: "theme_document",
      resourceId: current.id,
      payload: { version: current.version, documentHash: current.document_hash, changedPaths: 0 },
    });
    return { ok: true, data: null };
  }

  return { saveDraft, publish, rollback, discard };
}
