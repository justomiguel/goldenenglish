import { buildPublishPlan } from "@/lib/theme-document/buildPublishPlan";

function readArgs(argv: string[]): { slug: string; dryRun: boolean } | null {
  const args = argv.filter((arg) => arg !== "--");
  const slug = args.find((arg) => !arg.startsWith("-"));
  if (!slug) return null;
  return { slug, dryRun: args.includes("--dry-run") };
}

async function loadDocument(slug: string): Promise<unknown> {
  const mod = (await import(`./theme-documents/${slug}.ts`)) as { document?: unknown };
  if (!mod.document) throw new Error("document_missing");
  return mod.document;
}

async function publishLive(slug: string, document: unknown): Promise<boolean> {
  const { createThemeDocumentService } = await import("@/lib/theme-document/createThemeDocumentService");
  const { writeVariantPins } = await import("@/lib/theme-document/server/writeVariantPins");
  const { loadPulsarTenantBySlugForAdmin } = await import("@/lib/pulsar/pulsarTenantStore");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { enterTenant } = await import("@/lib/tenant/tenantAls");
  const { getTenantBySlug } = await import("@/lib/tenant/tenantRegistry");
  const tenant = (await loadPulsarTenantBySlugForAdmin(slug)) ?? getTenantBySlug(slug);
  if (!tenant) {
    console.error("tenant_missing");
    return false;
  }
  enterTenant(tenant);
  const client = await createAdminClient();
  const brandSlug = tenant.brandThemeSlug?.trim() ?? "";
  const query = client.from("site_themes").select("id").is("archived_at", null);
  const { data, error } = await (brandSlug
    ? query.eq("slug", brandSlug).maybeSingle()
    : query.eq("is_active", true).limit(1).maybeSingle());
  if (error || typeof data?.id !== "string") {
    console.error("theme_missing");
    return false;
  }
  const service = createThemeDocumentService({
    client,
    tenantSlug: slug,
    actor: { id: "", role: "staff" },
    pins: writeVariantPins,
  });
  const siteThemeId = data.id;
  const result = await buildPublishPlan({
    document,
    tenantSlug: slug,
    dryRun: false,
    write: (line) => console.log(line),
    publish: async (plan) => {
      const current = await client
        .from("theme_documents")
        .select("document_hash")
        .eq("site_theme_id", siteThemeId)
        .eq("status", "draft")
        .maybeSingle();
      const baseHash = typeof current.data?.document_hash === "string" ? current.data.document_hash : null;
      const saved = await service.saveDraft({ siteThemeId, document: plan.document, baseHash });
      if (!saved.ok) return { ok: false as const, code: saved.code };
      const published = await service.publish({ siteThemeId, expectedHash: saved.data.hash });
      if (!published.ok) return { ok: false as const, code: published.code };
      return { ok: true as const, version: published.data.version };
    },
  });
  if (!result.ok) {
    console.error(result.code);
    return false;
  }
  return true;
}

async function main(): Promise<void> {
  const parsed = readArgs(process.argv.slice(2));
  if (!parsed) {
    console.error("Usage: npx tsx scripts/publish-theme-document.ts <slug> [--dry-run]");
    process.exit(1);
  }
  const document = await loadDocument(parsed.slug);
  if (parsed.dryRun) {
    const result = await buildPublishPlan({
      document,
      tenantSlug: parsed.slug,
      dryRun: true,
      publish: async () => ({ ok: true, version: 0 }),
      write: (line) => console.log(line),
    });
    if (!result.ok) {
      console.error(result.code);
      process.exit(1);
    }
    return;
  }
  const ok = await publishLive(parsed.slug, document);
  if (!ok) process.exit(1);
}

void main();
