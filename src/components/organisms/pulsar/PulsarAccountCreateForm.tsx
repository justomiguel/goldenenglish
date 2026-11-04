"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createOwnerSiteAction } from "@/app/[locale]/cuenta/actions";
import { Button } from "@/components/atoms/Button";
import { PulsarTemplatePicker, type PulsarTemplatePreview } from "@/components/organisms/pulsar/PulsarTemplatePicker";
import { PulsarTenantProvisionDialog } from "@/components/organisms/pulsar/PulsarTenantProvisionDialog";
import { usePulsarTenantProvisionJob } from "@/hooks/usePulsarTenantProvisionJob";
import { ownerSiteSlug } from "@/lib/pulsar/ownerSiteSlug";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

function createSiteErrorMessage(code: string, copy: Dictionary["pulsar"]["account"]): string {
  if (code === "free_site_limit") return copy.limitReached;
  if (code === "owner_not_approved") return copy.pendingLead;
  if (code === "vercel_domain_failed") return copy.domainFailed;
  if (code === "slug_invalid") return copy.slugInvalid;
  if (code === "invalid_slug" || code === "duplicate_slug" || code === "duplicate_host") return copy.slugTaken;
  if (code === "unauthorized") return copy.sessionExpired;
  if (
    code === "invalid_input" ||
    code === "missing_display_name" ||
    code === "missing_hosts" ||
    code === "reserved_pulsar_host"
  ) {
    return copy.checkFields;
  }
  if (code === "pulsar_shared_db_unconfigured" || code === "not_configured") return copy.sharedDbFailed;
  if (code === "schema_provision_failed" || code === "db_write_failed") return copy.schemaFailed;
  return copy.createFailed;
}

export type { PulsarTemplatePreview };

export function PulsarAccountCreateForm({
  locale,
  copy,
  brandName,
  previews,
}: {
  locale: string;
  copy: Dictionary["pulsar"]["account"];
  brandName: string;
  previews: readonly PulsarTemplatePreview[];
}) {
  const router = useRouter();
  const steps = copy.provision;
  const provision = usePulsarTenantProvisionJob(
    {
      schema: steps.primarySchema,
      migration: steps.primaryMigration,
      grants: steps.primaryGrants,
      theme: steps.primaryTheme,
      domain: steps.primaryDomain,
      domainSkipped: steps.primaryDomainSkipped,
      done: steps.primaryDone,
      failed: steps.primaryFailed,
      count: steps.count,
    },
    "/api/cuenta/schema-provision",
  );
  const [kind, setKind] = useState<GenericInstituteKind>(previews[0]?.kind ?? "idiomas");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const slug = String(data.get("slug") ?? "");
    const save = () =>
      createOwnerSiteAction({
        locale,
        displayName: String(data.get("displayName") ?? ""),
        slug,
        kind,
        customDomain: String(data.get("customDomain") ?? ""),
        colorPrimary: String(data.get("colorPrimary") ?? ""),
        colorAccent: String(data.get("colorAccent") ?? ""),
        colorPaper: String(data.get("colorPaper") ?? ""),
      });
    const normalized = ownerSiteSlug(slug);
    const result = normalized ? await provision.track(normalized, save) : await save();
    setPending(false);
    if (!result.ok) {
      setError(createSiteErrorMessage(result.errorCode, copy));
      return;
    }
    router.push(`/${locale}/admin/tenants/${result.slug}/theme`);
    router.refresh();
  }

  return (
    <>
    <PulsarTenantProvisionDialog
      open={provision.open}
      isRunning={provision.isRunning}
      primaryLine={provision.primaryLine}
      secondaryLine={provision.secondaryLine}
      lines={provision.lines}
      title={steps.title}
      intro={steps.intro}
      explain={steps.explain}
      logTitle={steps.logTitle}
      empty={steps.empty}
      running={steps.running}
      closeLabel={steps.close}
      onOpenChange={provision.setOpen}
    />
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-6 px-5 py-12">
      <h1 className="font-display text-3xl font-medium tracking-tight">{copy.createTitle}</h1>
      <p className="max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">{copy.createLead}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.pageOnly}</p>
      <label className="block text-sm font-semibold" htmlFor="site-name">
        {copy.displayName}
        <input id="site-name" name="displayName" required minLength={2} className={fieldClass} />
      </label>
      <div>
        <label className="block text-sm font-semibold" htmlFor="site-slug">
          {copy.slug}
          <input
            id="site-slug"
            name="slug"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={copy.slugPlaceholder}
            className={fieldClass}
          />
        </label>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">{copy.slugHint}</p>
      </div>
      <div>
        <label className="block text-sm font-semibold" htmlFor="site-domain">
          {copy.customDomain}
          <input id="site-domain" name="customDomain" placeholder={copy.customDomainHint} className={fieldClass} />
        </label>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {copy.customDomainNote.replaceAll("{brand}", brandName)}
        </p>
      </div>
      <PulsarTemplatePicker
        locale={locale}
        copy={copy}
        previews={previews}
        kind={kind}
        onKindChange={setKind}
      />
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Plus className="h-4 w-4" aria-hidden />
        {copy.submitCreate}
      </Button>
    </form>
    </>
  );
}
