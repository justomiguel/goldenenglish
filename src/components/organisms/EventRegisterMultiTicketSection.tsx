"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { EventCompanionPayload } from "@/lib/events/types";

export interface EventRegisterCompanionsLabels {
  title: string;
  quantityLabel: string;
  quantityHint: string;
  holderTitle: string;
  companionTitle: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  email: string;
  totalLabel: string;
  totalHint: string;
}

interface EventRegisterMultiTicketSectionProps {
  ticketQuantity: number;
  onTicketQuantityChange: (nextQuantity: number) => void;
  requireCompanionDetails: boolean;
  collectDni: boolean;
  collectEmail: boolean;
  collectBirthDate: boolean;
  companions: EventCompanionPayload[];
  onCompanionChange: (index: number, partial: Partial<EventCompanionPayload>) => void;
  disabled?: boolean;
  labels: EventRegisterCompanionsLabels;
}

export function EventRegisterMultiTicketSection({
  ticketQuantity,
  onTicketQuantityChange,
  requireCompanionDetails,
  collectDni,
  collectEmail,
  collectBirthDate,
  companions,
  onCompanionChange,
  disabled,
  labels,
}: EventRegisterMultiTicketSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4">
      <div className="max-w-xs">
        <Label htmlFor="event-register-ticket-quantity">{labels.quantityLabel}</Label>
        <Input
          id="event-register-ticket-quantity"
          type="number"
          min={1}
          value={String(ticketQuantity)}
          disabled={disabled}
          onChange={(e) => {
            const parsed = Number.parseInt(e.target.value, 10);
            if (!Number.isFinite(parsed)) return;
            onTicketQuantityChange(Math.max(1, parsed));
          }}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.quantityHint}</p>
      </div>

      {requireCompanionDetails && ticketQuantity > 1 ? (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h4>
          {Array.from({ length: ticketQuantity - 1 }, (_, index) => {
            const companion = companions[index] ?? { firstName: "", lastName: "" };
            const heading = labels.companionTitle.replace("{{number}}", String(index + 1));
            return (
              <div
                key={`companion-${index}`}
                className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  {heading}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`companion-${index}-first-name`}>{labels.firstName}</Label>
                    <Input
                      id={`companion-${index}-first-name`}
                      required
                      disabled={disabled}
                      value={companion.firstName}
                      onChange={(e) => onCompanionChange(index, { firstName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`companion-${index}-last-name`}>{labels.lastName}</Label>
                    <Input
                      id={`companion-${index}-last-name`}
                      required
                      disabled={disabled}
                      value={companion.lastName}
                      onChange={(e) => onCompanionChange(index, { lastName: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  {collectDni ? (
                    <div>
                      <Label htmlFor={`companion-${index}-dni`}>{labels.dni}</Label>
                      <Input
                        id={`companion-${index}-dni`}
                        disabled={disabled}
                        value={companion.dniOrPassport ?? ""}
                        onChange={(e) => onCompanionChange(index, { dniOrPassport: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  ) : null}
                  {collectEmail ? (
                    <div>
                      <Label htmlFor={`companion-${index}-email`}>{labels.email}</Label>
                      <Input
                        id={`companion-${index}-email`}
                        type="email"
                        disabled={disabled}
                        value={companion.email ?? ""}
                        onChange={(e) => onCompanionChange(index, { email: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  ) : null}
                  {collectBirthDate ? (
                    <div>
                      <Label htmlFor={`companion-${index}-birth-date`}>{labels.birthDate}</Label>
                      <Input
                        id={`companion-${index}-birth-date`}
                        type="date"
                        disabled={disabled}
                        value={companion.birthDate ?? ""}
                        onChange={(e) => onCompanionChange(index, { birthDate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
