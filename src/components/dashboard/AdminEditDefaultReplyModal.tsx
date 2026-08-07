"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { setMessagingDefaultReplyTemplateAction } from "@/app/[locale]/dashboard/admin/messages/defaultReplyActions";
import { locales, type AppLocale } from "@/lib/i18n/dictionaries";
import type { MessagingDefaultReplyTemplates } from "@/lib/messaging/messagingDefaultReplyConstants";
import type { Dictionary } from "@/types/i18n";

interface AdminEditDefaultReplyModalProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplates: MessagingDefaultReplyTemplates;
  labels: Dictionary["admin"]["messages"];
}

export function AdminEditDefaultReplyModal({
  locale,
  open,
  onOpenChange,
  initialTemplates,
  labels,
}: AdminEditDefaultReplyModalProps) {
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const fieldId = useId();
  const [draft, setDraft] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState<AppLocale>("es");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => {
      setDraft(initialTemplates);
      setFeedback(null);
      setActiveTab(locale === "en" || locale === "pt" ? locale : "es");
    });
  }, [open, initialTemplates, locale]);

  const tabLabel = (loc: AppLocale) => {
    if (loc === "es") return labels.editDefaultMessageTabEs;
    if (loc === "en") return labels.editDefaultMessageTabEn;
    return labels.editDefaultMessageTabPt;
  };

  async function onSave() {
    setBusy(true);
    setFeedback(null);
    const res = await setMessagingDefaultReplyTemplateAction(locale, draft);
    setBusy(false);
    if (!res.ok) {
      setFeedback(
        res.error === "empty" ? labels.editDefaultMessageErrorEmpty : labels.editDefaultMessageError,
      );
      return;
    }
    setFeedback(labels.editDefaultMessageSaved);
    router.refresh();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={labels.editDefaultMessageModalTitle}
      closeLabel={labels.editDefaultMessageCancel}
      disableClose={busy}
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.editDefaultMessageModalLead}
      </p>
      <div
        role="tablist"
        aria-label={labels.editDefaultMessageFieldLabel}
        className="flex flex-wrap gap-1 border-b border-[var(--color-border)] pb-2"
      >
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            role="tab"
            aria-selected={activeTab === loc}
            disabled={busy}
            className={[
              "min-h-9 rounded-[var(--layout-border-radius)] px-3 text-sm font-medium transition-colors",
              activeTab === loc
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "bg-[var(--color-muted)]/40 text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/60",
            ].join(" ")}
            onClick={() => setActiveTab(loc)}
          >
            {tabLabel(loc)}
          </button>
        ))}
      </div>
      <div className="space-y-2" role="tabpanel">
        <Label htmlFor={fieldId}>
          {labels.editDefaultMessageFieldLabel} ({tabLabel(activeTab)})
        </Label>
        <textarea
          id={fieldId}
          value={draft[activeTab]}
          onChange={(e) => setDraft((prev) => ({ ...prev, [activeTab]: e.target.value }))}
          rows={8}
          disabled={busy}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        />
      </div>
      {feedback ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {feedback}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.editDefaultMessageCancel}
        </Button>
        <Button type="button" variant="primary" isLoading={busy} disabled={busy} onClick={onSave}>
          {busy ? null : <Save className="h-4 w-4 shrink-0" aria-hidden />}
          {labels.editDefaultMessageSave}
        </Button>
      </div>
    </Modal>
  );
}
