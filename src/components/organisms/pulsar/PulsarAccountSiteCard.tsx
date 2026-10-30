"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, Settings } from "lucide-react";
import { updateOwnerSiteDomainAction } from "@/app/[locale]/cuenta/actions";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

export function PulsarAccountSiteCard({
  locale,
  site,
  copy,
}: {
  locale: string;
  site: { slug: string; displayName: string; previewUrl: string; customDomain: string; dnsText: string };
  copy: Dictionary["pulsar"]["account"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const data = new FormData(event.currentTarget);
    const result = await updateOwnerSiteDomainAction({
      locale,
      slug: site.slug,
      customDomain: String(data.get("customDomain") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      if (result.errorCode === "vercel_domain_failed") setError(copy.domainFailed);
      else if (result.errorCode === "duplicate_host") setError(copy.domainTaken);
      else if (result.errorCode === "invalid_domain") setError(copy.domainInvalid);
      else setError(copy.createFailed);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <li className="space-y-3 border-t border-[var(--color-border)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-base font-medium">{site.displayName}</span>
        <span className="flex flex-wrap gap-3">
          {site.previewUrl ? (
            <a href={site.previewUrl} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <ExternalLink className="h-4 w-4" aria-hidden />
              {copy.openPage}
            </a>
          ) : null}
          <a href={`/${locale}/admin/tenants/${site.slug}/theme`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
            <Settings className="h-4 w-4" aria-hidden />
            {copy.editSite}
          </a>
        </span>
      </div>
      {site.previewUrl ? <p className="text-sm text-[var(--color-muted-foreground)]">{copy.previewLabel}: {site.previewUrl}</p> : null}
      <form onSubmit={onSubmit} className="space-y-2">
        <label className="block text-sm font-semibold" htmlFor={`domain-${site.slug}`}>
          {copy.customDomain}
          <input id={`domain-${site.slug}`} name="customDomain" defaultValue={site.customDomain} placeholder={copy.customDomainHint} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
        </label>
        {site.dnsText ? <p className="text-sm text-[var(--color-muted-foreground)]">{site.dnsText}</p> : null}
        {saved ? <p className="text-sm">{copy.domainSaved}</p> : null}
        {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        <Button type="submit" isLoading={pending}>
          <Save className="h-4 w-4" aria-hidden />
          {copy.domainSave}
        </Button>
      </form>
    </li>
  );
}
