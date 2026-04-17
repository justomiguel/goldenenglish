"use client";

import { useId, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { generateAdminPortalPassword } from "@/lib/dashboard/generateAdminPortalPassword";
import { setAdminUserPasswordFromDetailAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailPasswordSectionProps {
  locale: string;
  userId: string;
  labels: UserLabels;
  enabled: boolean;
  onFeedback: (message: string, ok: boolean) => void;
}

export function AdminUserDetailPasswordSection({
  locale,
  userId,
  labels,
  enabled,
  onFeedback,
}: AdminUserDetailPasswordSectionProps) {
  const router = useRouter();
  const titleId = useId();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [manual, setManual] = useState("");
  const [generated, setGenerated] = useState(() => generateAdminPortalPassword());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const regen = useCallback(() => {
    try {
      setGenerated(generateAdminPortalPassword());
    } catch {
      onFeedback(labels.detailErrSave, false);
    }
  }, [labels.detailErrSave, onFeedback]);

  const copyGenerated = useCallback(async () => {
    const pwd = mode === "auto" ? generated : manual;
    try {
      await navigator.clipboard.writeText(pwd);
      onFeedback(labels.detailPasswordCopied, true);
    } catch {
      onFeedback(labels.detailErrSave, false);
    }
  }, [generated, labels.detailErrSave, labels.detailPasswordCopied, manual, mode, onFeedback]);

  const requestApply = () => {
    const pwd = mode === "manual" ? manual.trim() : generated;
    if (pwd.length < 8) {
      onFeedback(labels.detailErrPasswordPolicy, false);
      return;
    }
    setConfirmOpen(true);
  };

  const applyPassword = async () => {
    const pwd = mode === "manual" ? manual.trim() : generated;
    setBusy(true);
    try {
      const r = await setAdminUserPasswordFromDetailAction({
        locale,
        targetUserId: userId,
        password: pwd,
        confirmed: true,
      });
      if (r.ok) {
        onFeedback(r.message ?? labels.detailToastPasswordSet, true);
        setConfirmOpen(false);
        setManual("");
        regen();
        router.refresh();
      } else {
        onFeedback(r.message ?? labels.detailErrSave, false);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!enabled) return null;

  const readonlyPwd = mode === "auto" ? generated : manual;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
        <KeyRound className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">{labels.detailPasswordTitle}</h2>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{labels.detailPasswordLead}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant={mode === "manual" ? "primary" : "ghost"} size="sm" onClick={() => setMode("manual")}>
          {labels.detailPasswordModeManual}
        </Button>
        <Button type="button" variant={mode === "auto" ? "primary" : "ghost"} size="sm" onClick={() => setMode("auto")}>
          {labels.detailPasswordModeAuto}
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {mode === "manual" ? (
          <div>
            <Label htmlFor="admin-user-pw-manual">{labels.detailPasswordManualPlaceholder}</Label>
            <Input
              id="admin-user-pw-manual"
              type="password"
              autoComplete="new-password"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="mt-1 w-full"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="admin-user-pw-auto">{labels.detailPasswordGeneratedReadonly}</Label>
            <Input id="admin-user-pw-auto" readOnly value={generated} className="mt-1 w-full font-mono text-sm" />
            <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={regen}>
              {labels.detailPasswordRegenerate}
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void copyGenerated()} disabled={readonlyPwd.length === 0}>
            {labels.detailPasswordCopy}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={requestApply}>
            {labels.detailPasswordApply}
          </Button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        titleId={titleId}
        descriptionId={`${titleId}-desc`}
        title={labels.detailPasswordConfirmTitle}
      >
        <p id={`${titleId}-desc`} className="text-sm text-[var(--color-muted-foreground)]">
          {labels.detailPasswordConfirmBody}
        </p>
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmOpen(false)} disabled={busy}>
            {labels.cancel}
          </Button>
          <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={() => void applyPassword()}>
            {labels.detailPasswordConfirmAction}
          </Button>
        </div>
      </Modal>
    </section>
  );
}
