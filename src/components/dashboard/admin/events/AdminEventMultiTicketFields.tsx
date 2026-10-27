"use client";

export interface AdminEventMultiTicketConfig {
  allowMultipleTickets: boolean;
  maxTicketsPerRegistration: number;
  companionRequireDetails: boolean;
  companionCollectDni: boolean;
  companionCollectEmail: boolean;
  companionCollectBirthDate: boolean;
}

export interface AdminEventMultiTicketLabels {
  enabledLabel: string;
  maxLabel: string;
  modeLabel: string;
  modeHolderOnly: string;
  modeAskCompanions: string;
  companionDni: string;
  companionEmail: string;
  companionBirthDate: string;
}

interface AdminEventMultiTicketFieldsProps {
  config: AdminEventMultiTicketConfig;
  disabled?: boolean;
  labels: AdminEventMultiTicketLabels;
  onChange: (next: AdminEventMultiTicketConfig) => void;
}

export function AdminEventMultiTicketFields({
  config,
  disabled,
  labels,
  onChange,
}: AdminEventMultiTicketFieldsProps) {
  function patch(partial: Partial<AdminEventMultiTicketConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <fieldset
      className="space-y-3 rounded-md border border-[var(--color-border)] p-3 disabled:opacity-50 md:col-span-2"
      disabled={disabled}
    >
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={config.allowMultipleTickets}
          onChange={(e) => patch({ allowMultipleTickets: e.target.checked })}
        />
        <span>{labels.enabledLabel}</span>
      </label>

      {config.allowMultipleTickets ? (
        <div className="space-y-3 pl-6">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.modeLabel}</p>
            <label className="flex min-h-9 items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="radio"
                name="event-companion-details-mode"
                checked={!config.companionRequireDetails}
                onChange={() => patch({ companionRequireDetails: false })}
              />
              <span>{labels.modeHolderOnly}</span>
            </label>
            <label className="flex min-h-9 items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="radio"
                name="event-companion-details-mode"
                checked={config.companionRequireDetails}
                onChange={() => patch({ companionRequireDetails: true })}
              />
              <span>{labels.modeAskCompanions}</span>
            </label>
          </div>

          {config.companionRequireDetails ? (
            <div className="flex flex-wrap gap-4 pl-6">
              <label className="flex min-h-9 items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  checked={config.companionCollectDni}
                  onChange={(e) => patch({ companionCollectDni: e.target.checked })}
                />
                <span>{labels.companionDni}</span>
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  checked={config.companionCollectEmail}
                  onChange={(e) => patch({ companionCollectEmail: e.target.checked })}
                />
                <span>{labels.companionEmail}</span>
              </label>
              <label className="flex min-h-9 items-center gap-2 text-sm text-[var(--color-foreground)]">
                <input
                  type="checkbox"
                  checked={config.companionCollectBirthDate}
                  onChange={(e) => patch({ companionCollectBirthDate: e.target.checked })}
                />
                <span>{labels.companionBirthDate}</span>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
