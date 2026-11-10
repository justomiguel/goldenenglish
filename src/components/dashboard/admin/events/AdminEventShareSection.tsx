"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Share2, Unlink } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  requestEventShareAction,
  requestEventUnshareAction,
} from "@/app/[locale]/dashboard/admin/events/eventShareActions";
import { eventShareFailureMessage } from "@/lib/events/eventShareFailureMessage";

type GrantRow = { id: string; guestSlug: string; status: string };
type SiteRow = { slug: string; displayName: string };

interface AdminEventShareSectionProps {
  locale: string;
  eventId: string;
  access: "local" | "guest";
  ownerName: string;
  grants: GrantRow[];
  sites: SiteRow[];
  labels: Record<string, string>;
}

export function AdminEventShareSection({
  locale,
  eventId,
  access,
  ownerName,
  grants,
  sites,
  labels,
}: AdminEventShareSectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (access === "guest") {
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
          <Share2 className="h-4 w-4" aria-hidden />
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {labels.guestLead.replace("{site}", ownerName)}
        </p>
      </section>
    );
  }

  const openGuests = new Set(
    grants
      .filter((grant) => grant.status === "pending" || grant.status === "approved" || grant.status === "pending_unshare")
      .map((grant) => grant.guestSlug),
  );

  async function sendRequest() {
    setPending(true);
    setMessage("");
    const result = await requestEventShareAction({ locale, eventId, guestSlugs: selected });
    setPending(false);
    if (!result.ok) {
      setMessage(eventShareFailureMessage(result.code ?? "share_store_failed", labels));
      return;
    }
    const notice = result.notices?.includes("slug_taken") ? labels.slug_taken : labels.saved;
    setMessage(notice);
    setSelected([]);
    router.refresh();
  }

  async function unshare(grantId: string) {
    setPending(true);
    setMessage("");
    const result = await requestEventUnshareAction({ locale, eventId, grantId });
    setPending(false);
    if (!result.ok) {
      setMessage(eventShareFailureMessage(result.code ?? "share_store_failed", labels));
      return;
    }
    setMessage(labels.saved);
    router.refresh();
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]">
        <Share2 className="h-4 w-4" aria-hidden />
        {labels.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      {sites.length === 0 ? <p className="text-sm text-[var(--color-foreground)]">{labels.empty}</p> : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--color-foreground)]">{labels.sitesLabel}</legend>
        {sites.map((site) => (
          <label key={site.slug} className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={selected.includes(site.slug)}
              disabled={openGuests.has(site.slug) || pending}
              onChange={(event) => {
                setSelected((current) =>
                  event.target.checked
                    ? [...current, site.slug]
                    : current.filter((slug) => slug !== site.slug),
                );
              }}
            />
            <span>{site.displayName}</span>
          </label>
        ))}
      </fieldset>
      <Button type="button" disabled={pending || selected.length === 0} onClick={() => void sendRequest()}>
        <Send className="h-4 w-4" aria-hidden />
        {labels.request}
      </Button>
      <ul className="space-y-2">
        {grants.map((grant) => (
          <li key={grant.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[var(--color-foreground)]">
              {grant.guestSlug} · {labels[grant.status] ?? grant.status}
            </span>
            {grant.status === "approved" ? (
              <Button type="button" variant="ghost" disabled={pending} onClick={() => void unshare(grant.id)}>
                <Unlink className="h-4 w-4" aria-hidden />
                {labels.unshare}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
    </section>
  );
}
