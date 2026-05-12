"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Filter, User, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { messagingRecipientDisplayName } from "@/lib/messaging/recipientSearch";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

interface AdminPortalMessagesFiltersProps {
  locale: string;
  labels: Dictionary["admin"]["messages"];
  recipients: MessagingRecipient[];
  initialParticipantId?: string | null;
  initialContactOnly: boolean;
}

export function AdminPortalMessagesFilters({
  locale,
  labels,
  recipients,
  initialParticipantId,
  initialContactOnly,
}: AdminPortalMessagesFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formId = useId();
  const participantFieldId = `${formId}-participant`;
  const contactFieldId = `${formId}-contact`;
  const panelId = `${formId}-filters-panel`;

  const participantId = initialParticipantId ?? "";
  const contactOnly = initialContactOnly;

  const filtersActive = Boolean(initialParticipantId || initialContactOnly);
  const [filtersOpen, setFiltersOpen] = useState(filtersActive);

  const roleLabels = useMemo(
    () => ({
      student: labels.roleStudent,
      parent: labels.roleParent,
      teacher: labels.roleTeacher,
      admin: labels.roleAdmin,
    }),
    [labels],
  );

  function navigateWith(participant: string, contact: boolean) {
    const p = new URLSearchParams();
    if (participant) p.set("participant", participant);
    if (contact) p.set("contact", "1");
    const qs = p.toString();
    startTransition(() => {
      router.push(`/${locale}/dashboard/admin/messages${qs ? `?${qs}` : ""}`);
    });
  }

  function clearFilters() {
    startTransition(() => {
      router.push(`/${locale}/dashboard/admin/messages`);
    });
  }

  const selectedRecipient = useMemo(
    () => (participantId ? recipients.find((r) => r.id === participantId) : undefined),
    [participantId, recipients],
  );

  const participantChipLabel = selectedRecipient
    ? messagingRecipientDisplayName(selectedRecipient)
    : labels.filterParticipantChipUnknown;

  function clearParticipantOnly() {
    navigateWith("", contactOnly);
  }

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="secondary"
        className="min-h-[44px] gap-2"
        aria-expanded={filtersOpen}
        aria-controls={panelId}
        title={filtersOpen ? labels.filterToggleCollapseTitle : labels.filterToggleExpandTitle}
        onClick={() => setFiltersOpen((v) => !v)}
      >
        <Filter className="h-4 w-4 shrink-0" aria-hidden />
        <span className="inline-flex items-center gap-2">
          {labels.filterToggleLabel}
          {filtersActive ? (
            <span
              className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden
            />
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Button>

      <section
        id={panelId}
        hidden={!filtersOpen}
        aria-label={labels.filterSectionAria}
        aria-busy={isPending}
        className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4 md:p-5"
      >
        <div className="grid gap-4 md:grid-cols-2 md:items-end md:gap-6">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={participantFieldId}>{labels.filterParticipantLabel}</Label>
            <RecipientAutocomplete
              id={participantFieldId}
              options={recipients}
              value={participantId}
              onValueChange={(next) => {
                navigateWith(next, contactOnly);
              }}
              disabled={false}
              placeholder={labels.filterParticipantPlaceholder}
              noMatchesText={labels.recipientNoMatches}
              emptyOptionsText={labels.recipientListEmpty}
              roleLabels={roleLabels}
              ariaLabel={labels.filterParticipantLabel}
              inputTitle={labels.tipComposeRecipient}
              emptyInputWhenSelected
            />
            {participantId ? (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-primary)]/35 bg-[var(--color-primary)]/10 py-1 pl-2.5 pr-1 text-sm font-medium text-[var(--color-foreground)]">
                  <User className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" aria-hidden />
                  <span className="min-w-0 truncate">{participantChipLabel}</span>
                  <button
                    type="button"
                    disabled={isPending}
                    title={labels.filterParticipantChipRemoveTitle}
                    aria-label={labels.filterParticipantChipRemoveTitle}
                    className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]/80 hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    onClick={clearParticipantOnly}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 md:pb-[2px]">
            <span className="text-sm font-medium text-[var(--color-foreground)]">
              {labels.filterContactOnlyLabel}
            </span>
            <label htmlFor={contactFieldId} className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                id={contactFieldId}
                type="checkbox"
                checked={contactOnly}
                onChange={(e) => {
                  navigateWith(participantId, e.target.checked);
                }}
                className="h-4 w-4 shrink-0 rounded border-[var(--color-border)] text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              />
              <span className="text-sm text-[var(--color-muted-foreground)]">{labels.filterContactOnlyHint}</span>
            </label>
          </div>
        </div>
        {filtersActive ? (
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="secondary"
              className="min-h-[44px]"
              disabled={isPending}
              title={labels.filterClearTitle}
              onClick={clearFilters}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {labels.filterClear}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
