"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createOwnerSiteAction } from "@/app/[locale]/cuenta/actions";
import { Button } from "@/components/atoms/Button";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";

export function PulsarAccountCreateForm({
  locale,
  copy,
  kindLabels,
}: {
  locale: string;
  copy: Dictionary["pulsar"]["account"];
  kindLabels: Record<(typeof GENERIC_INSTITUTE_KINDS)[number], string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await createOwnerSiteAction({
      locale,
      displayName: String(data.get("displayName") ?? ""),
      slug: String(data.get("slug") ?? ""),
      kind: String(data.get("kind") ?? ""),
      customDomain: String(data.get("customDomain") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      if (result.errorCode === "free_site_limit") setError(copy.limitReached);
      else if (result.errorCode === "owner_not_approved") setError(copy.pendingLead);
      else if (result.errorCode === "vercel_domain_failed") setError(copy.domainFailed);
      else if (
        result.errorCode === "invalid_slug" ||
        result.errorCode === "duplicate_slug" ||
        result.errorCode === "duplicate_host"
      ) setError(copy.slugTaken);
      else setError(copy.createFailed);
      return;
    }
    router.push(`/${locale}/admin/tenants/${result.slug}/theme`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 px-5 py-16">
      <h1 className="text-2xl font-medium">{copy.createTitle}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.createLead}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.pageOnly}</p>
      <label className="block text-sm font-semibold" htmlFor="site-name">
        {copy.displayName}
        <input id="site-name" name="displayName" required minLength={2} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-slug">
        {copy.slug}
        <input id="site-slug" name="slug" required pattern="[a-z0-9](?:[a-z0-9-]{0,62})?" className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-domain">
        {copy.customDomain}
        <input id="site-domain" name="customDomain" placeholder={copy.customDomainHint} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-kind">
        {copy.template}
        <select id="site-kind" name="kind" className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
          {GENERIC_INSTITUTE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabels[kind]}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Plus className="h-4 w-4" aria-hidden />
        {copy.submitCreate}
      </Button>
    </form>
  );
}
