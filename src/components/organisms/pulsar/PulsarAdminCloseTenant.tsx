"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { closePulsarTenantAction } from "@/app/[locale]/admin/closeTenantAction";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminCloseTenantProps {
  locale: string;
  slug: string;
  copy: Dictionary["pulsar"]["admin"]["form"];
  redirectTo?: string;
}

export function PulsarAdminCloseTenant({ locale, slug, copy, redirectTo }: PulsarAdminCloseTenantProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    setErrorCode(null);
    const result = await closePulsarTenantAction({
      locale,
      slug,
      confirmSlug: typed,
    });
    setPending(false);
    if (!result.ok) {
      setErrorCode(result.errorCode);
      return;
    }
    setOpen(false);
    router.push(redirectTo ?? `/${locale}/admin`);
    router.refresh();
  }

  const errorText =
    errorCode === "slug_mismatch"
      ? copy.closeSlugMismatch
      : errorCode
        ? copy.errors.db_write_failed
        : null;

  return (
    <div className="mt-10 border-t border-[var(--color-border)] pt-6">
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" aria-hidden />
        {copy.closeCta}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId="close-institute-title"
        title={copy.closeTitle}
      >
        <p id="close-institute-body" className="text-sm text-[var(--color-muted-foreground)]">
          {copy.closeLead}
        </p>
        <label className="mt-4 block text-sm font-semibold" htmlFor="close-institute-slug">
          {copy.closeSlugLabel}
        </label>
        <input
          id="close-institute-slug"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          autoComplete="off"
        />
        {errorText ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-error)]">
            {errorText}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            {copy.closeCancel}
          </Button>
          <Button
            type="button"
            variant="destructiveStrong"
            disabled={pending || typed.trim().toLowerCase() !== slug.toLowerCase()}
            onClick={() => void confirm()}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {copy.closeConfirm}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
