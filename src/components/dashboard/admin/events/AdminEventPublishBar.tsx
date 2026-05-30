"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ExternalLink, EyeOff, Send } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  publishEventAction,
  unpublishEventAction,
} from "@/app/[locale]/dashboard/admin/events/actions";

interface AdminEventPublishBarProps {
  locale: string;
  eventId: string;
  status: string;
  labels: {
    draftHint: string;
    publish: string;
    publishSuccess: string;
    publishError: string;
    unpublish: string;
    unpublishSuccess: string;
    unpublishError: string;
    viewPublic: string;
    publishedHint: string;
  };
}

export function AdminEventPublishBar({
  locale,
  eventId,
  status,
  labels,
}: AdminEventPublishBarProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isPublished = status === "published";

  function onPublish() {
    setMessage(null);
    startTransition(async () => {
      const result = await publishEventAction(locale, eventId);
      if (!result.ok) {
        setMessage(labels.publishError);
        return;
      }
      setMessage(labels.publishSuccess);
      router.refresh();
    });
  }

  function onUnpublish() {
    setMessage(null);
    startTransition(async () => {
      const result = await unpublishEventAction(locale, eventId);
      if (!result.ok) {
        setMessage(labels.unpublishError);
        return;
      }
      setMessage(labels.unpublishSuccess);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {isPublished ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.publishedHint}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onUnpublish}
              isLoading={pending}
              disabled={pending}
            >
              {!pending ? <EyeOff className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {labels.unpublish}
            </Button>
            <Link
              href={`/${locale}/events`}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)]"
            >
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
              {labels.viewPublic}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.draftHint}</p>
          <Button type="button" onClick={onPublish} isLoading={pending} disabled={pending}>
            {!pending ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.publish}
          </Button>
        </div>
      )}
      {message ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{message}</p> : null}
    </section>
  );
}
