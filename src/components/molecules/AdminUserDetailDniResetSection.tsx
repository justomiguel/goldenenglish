"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  RotateCcwKey,
  X,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { resetUserPasswordByDniAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailDniResetSectionProps {
  locale: string;
  userId: string;
  labels: UserLabels;
  enabled: boolean;
  onFeedback: (message: string, ok: boolean) => void;
}

interface RevealState {
  password: string;
  hasRealEmail: boolean;
}

export function AdminUserDetailDniResetSection({
  locale,
  userId,
  labels,
  enabled,
  onFeedback,
}: AdminUserDetailDniResetSectionProps) {
  const router = useRouter();
  const confirmTitleId = useId();
  const revealTitleId = useId();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<RevealState | null>(null);

  if (!enabled) return null;

  const closeConfirm = () => {
    if (busy) return;
    setConfirmOpen(false);
    setAdminPassword("");
  };

  const closeReveal = () => {
    setReveal(null);
    router.refresh();
  };

  const submit = async () => {
    setBusy(true);
    try {
      const r = await resetUserPasswordByDniAction({
        locale,
        targetUserId: userId,
        adminPassword,
        confirmed: true,
      });
      if (!r.ok) {
        onFeedback(r.message ?? labels.detailDniResetErrSave, false);
        return;
      }
      onFeedback(r.message ?? labels.detailDniResetToastOk, true);
      setReveal({ password: r.password, hasRealEmail: r.hasRealEmail });
      setConfirmOpen(false);
      setAdminPassword("");
    } finally {
      setBusy(false);
    }
  };

  const copyPassword = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.password);
      onFeedback(labels.detailPasswordCopied, true);
    } catch {
      onFeedback(labels.detailErrSave, false);
    }
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <RotateCcwKey className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.detailDniResetTitle}
        </h2>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
        {labels.detailDniResetLead}
      </p>
      <div className="mt-4">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setConfirmOpen(true)}
        >
          <RotateCcwKey className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailDniResetButton}
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        onOpenChange={(next) => {
          if (!next) closeConfirm();
          else setConfirmOpen(true);
        }}
        titleId={confirmTitleId}
        descriptionId={`${confirmTitleId}-desc`}
        title={labels.detailDniResetConfirmTitle}
      >
        <p
          id={`${confirmTitleId}-desc`}
          className="text-sm text-[var(--color-muted-foreground)]"
        >
          {labels.detailDniResetConfirmBody}
        </p>
        <div className="mt-4">
          <Label htmlFor="admin-dni-reset-password">
            {labels.detailDniResetAdminPasswordLabel}
          </Label>
          <Input
            id="admin-dni-reset-password"
            type="password"
            autoComplete="current-password"
            placeholder={labels.detailDniResetAdminPasswordPlaceholder}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="mt-1 w-full"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={closeConfirm}
            disabled={busy}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {labels.cancel}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={busy}
            disabled={adminPassword.length === 0}
            onClick={() => void submit()}
          >
            {!busy ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.detailDniResetConfirmAction}
          </Button>
        </div>
      </Modal>

      <Modal
        open={reveal !== null}
        onOpenChange={(next) => {
          if (!next) closeReveal();
        }}
        titleId={revealTitleId}
        descriptionId={`${revealTitleId}-desc`}
        title={labels.detailDniResetRevealTitle}
      >
        {reveal ? (
          <>
            <p
              id={`${revealTitleId}-desc`}
              className="text-sm text-[var(--color-muted-foreground)]"
            >
              {labels.detailDniResetRevealLead}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Input
                readOnly
                value={reveal.password}
                aria-label={labels.detailDniResetRevealTitle}
                className="flex-1 font-mono text-base"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void copyPassword()}
              >
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                {labels.detailDniResetRevealCopy}
              </Button>
            </div>
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,var(--color-surface))] px-3 py-2 text-sm text-[var(--color-error)]"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {labels.detailDniResetWarn}
            </p>
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              {reveal.hasRealEmail
                ? labels.detailDniResetRevealNoticeReal
                : labels.detailDniResetRevealNoticeSynthetic}
            </p>
            <div className="flex flex-wrap justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={closeReveal}
              >
                <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
                {labels.detailDniResetRevealClose}
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </section>
  );
}
