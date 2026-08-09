"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Link2, Power, RefreshCw, Share2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";
import { clientAbsoluteUrl } from "@/lib/client/publicUrl";
import type { SectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";
import {
  generateSectionEnrollmentLinkAction,
  rotateSectionEnrollmentLinkAction,
  setSectionEnrollmentLinkActiveAction,
} from "@/app/[locale]/dashboard/teacher/sections/[sectionId]/enrollmentLinkActions";
import type { Dictionary } from "@/types/i18n";

interface SectionEnrollmentLinkPanelProps {
  locale: string;
  sectionId: string;
  state: SectionEnrollmentLinkState;
  labels: Dictionary["dashboard"]["sectionEnrollmentLink"];
  /** Admins and the section's own teacher may revoke; read-only viewers may not. */
  canRevoke: boolean;
}

export function SectionEnrollmentLinkPanel({
  locale,
  sectionId,
  state,
  labels,
  canRevoke,
}: SectionEnrollmentLinkPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotateOpen, setRotateOpen] = useState(false);

  const url = state.token
    ? clientAbsoluteUrl(`/${locale}/i/${state.token}`)
    : null;

  function run(action: () => Promise<{ ok: boolean }>) {
    setError(false);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(true);
        return;
      }
      router.refresh();
    });
  }

  async function onCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError(true);
    }
  }

  async function onShare() {
    if (!url) return;
    if (typeof navigator.share !== "function") {
      await onCopy();
      return;
    }
    try {
      await navigator.share({ title: labels.title, url });
    } catch {
      // A cancelled share sheet is not an error worth reporting.
    }
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-primary)]">
        <Link2 className="h-5 w-5 shrink-0" aria-hidden />
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>

      {!url ? (
        <Button
          type="button"
          className="mt-4"
          disabled={pending}
          isLoading={pending}
          onClick={() =>
            run(() => generateSectionEnrollmentLinkAction(locale, sectionId))
          }
        >
          <Link2 className="h-4 w-4 shrink-0" aria-hidden />
          {labels.generate}
        </Button>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="sel-url">{labels.urlLabel}</Label>
            <Input id="sel-url" value={url} readOnly className="mt-1 w-full" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onCopy}>
              <Copy className="h-4 w-4 shrink-0" aria-hidden />
              {labels.copy}
            </Button>
            <Button type="button" variant="secondary" onClick={onShare}>
              <Share2 className="h-4 w-4 shrink-0" aria-hidden />
              {labels.share}
            </Button>
            {canRevoke ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      setSectionEnrollmentLinkActiveAction(
                        locale,
                        sectionId,
                        !state.active,
                      ),
                    )
                  }
                >
                  <Power className="h-4 w-4 shrink-0" aria-hidden />
                  {state.active ? labels.deactivate : labels.activate}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => setRotateOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.rotate}
                </Button>
              </>
            ) : null}
          </div>

          {copied ? (
            <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
              {labels.copied}
            </p>
          ) : null}
          {!state.active ? (
            <p className="text-sm text-[var(--color-foreground)]" role="note">
              {labels.inactiveNotice}
            </p>
          ) : null}
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {state.leadCount === 0
              ? labels.leadCountNone
              : labels.leadCount.replace("{count}", String(state.leadCount))}
          </p>
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-error)]" role="alert">
          {labels.error}
        </p>
      ) : null}

      <Modal
        open={rotateOpen}
        onOpenChange={setRotateOpen}
        titleId="sel-rotate-title"
        title={labels.rotateConfirmTitle}
      >
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.rotateConfirmBody}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setRotateOpen(false)}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            disabled={pending}
            isLoading={pending}
            onClick={() => {
              setRotateOpen(false);
              run(() => rotateSectionEnrollmentLinkAction(locale, sectionId));
            }}
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            {labels.rotateConfirm}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
