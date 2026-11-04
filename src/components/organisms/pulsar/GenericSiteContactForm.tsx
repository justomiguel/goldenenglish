"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { mergeSiteThemePropertiesAction } from "@/app/[locale]/dashboard/admin/cms/siteThemeBasicsAction";
import { Button } from "@/components/atoms/Button";
import { genericSiteContactPatch } from "@/lib/landing/genericSiteContactPatch";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

export function GenericSiteContactForm({
  locale,
  themeId,
  properties,
  labels,
}: {
  locale: string;
  themeId: string;
  properties: Readonly<Record<string, string>>;
  labels: {
    title: string;
    lead: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    instagram: string;
    save: string;
    saved: string;
    invalid: string;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSaved(false);
    setError(null);
    const data = new FormData(event.currentTarget);
    const patch = genericSiteContactPatch({
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      address: String(data.get("address") ?? ""),
      whatsapp: String(data.get("whatsapp") ?? ""),
      instagram: String(data.get("instagram") ?? ""),
    });
    if (!patch.ok) {
      setPending(false);
      setError(labels.invalid);
      return;
    }
    const result = await mergeSiteThemePropertiesAction({
      id: themeId,
      locale,
      patch: patch.patch,
    });
    setPending(false);
    if (!result.ok) {
      setError(labels.invalid);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-medium">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <label className="block text-sm font-semibold" htmlFor="site-email">
        {labels.email}
        <input id="site-email" name="email" type="email" maxLength={200} defaultValue={properties["contact.email"] ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-phone">
        {labels.phone}
        <input id="site-phone" name="phone" type="tel" maxLength={40} defaultValue={properties["contact.phone"] ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-whatsapp">
        {labels.whatsapp}
        <input id="site-whatsapp" name="whatsapp" maxLength={200} defaultValue={properties["social.whatsapp"] ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-instagram">
        {labels.instagram}
        <input id="site-instagram" name="instagram" maxLength={200} defaultValue={properties["social.instagram"] ?? ""} className={fieldClass} />
      </label>
      <label className="block text-sm font-semibold" htmlFor="site-address">
        {labels.address}
        <input id="site-address" name="address" maxLength={180} defaultValue={properties["contact.address"] ?? ""} className={fieldClass} />
      </label>
      {saved ? <p className="text-sm text-[var(--color-foreground)]">{labels.saved}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </form>
  );
}
