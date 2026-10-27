"use client";

import { EventRegisterBankTransferInstructions } from "@/components/organisms/EventRegisterBankTransferInstructions";
import { resolveEventTransferPresentation } from "@/lib/events/eventTransferPresentation";
import type { EventBankTransferSourcesConfig } from "@/lib/events/eventBankTransferSources";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

export interface EventRegisterDualTransferLabels {
  questionFallback: string;
  chooseSource: string;
}

interface EventRegisterDualTransferSectionProps {
  config: EventBankTransferSourcesConfig | null;
  bankTransferInstructions: string | null;
  globalTransferInstructions?: string | null;
  globalFallbackLabel?: string;
  selectedOptionId: string | null;
  selectedSourceKey: string | null;
  onOptionChange: (optionId: string) => void;
  onSourceChange: (sourceKey: string) => void;
  labels: EventRegisterDualTransferLabels;
  instructionsTitle: string;
  surfaceVariant?: PublicEventSurfaceVariant;
  disabled?: boolean;
}

export function EventRegisterDualTransferSection({
  config,
  bankTransferInstructions,
  globalTransferInstructions = null,
  globalFallbackLabel,
  selectedOptionId,
  selectedSourceKey,
  onOptionChange,
  onSourceChange,
  labels,
  instructionsTitle,
  surfaceVariant = "default",
  disabled,
}: EventRegisterDualTransferSectionProps) {
  const view = resolveEventTransferPresentation({
    config,
    bankTransferInstructions,
    globalTransferInstructions,
    globalFallbackLabel,
    selectedOptionId,
    selectedSourceKey,
  });

  if (!view.isDualActive) {
    if (!bankTransferInstructions?.trim()) return null;
    return (
      <EventRegisterBankTransferInstructions
        title={instructionsTitle}
        instructions={bankTransferInstructions}
        surfaceVariant={surfaceVariant}
      />
    );
  }

  const prompt = view.questionPrompt.trim() || labels.questionFallback;

  return (
    <div className="space-y-3">
      {view.askRoutingQuestion ? (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-[var(--color-foreground)]">{prompt}</legend>
          {view.questionOptions.map((option) => (
            <label
              key={option.id}
              className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]"
            >
              <input
                type="radio"
                name="event-transfer-option"
                checked={selectedOptionId === option.id}
                disabled={disabled}
                onChange={() => onOptionChange(option.id)}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {view.requiresSourcePicker ? (
        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-[var(--color-foreground)]">
            {labels.chooseSource}
          </legend>
          {view.availableSources.map((source) => (
            <label
              key={source.key}
              className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]"
            >
              <input
                type="radio"
                name="event-transfer-source"
                checked={selectedSourceKey === source.key}
                disabled={disabled}
                onChange={() => onSourceChange(source.key)}
              />
              {source.label}
            </label>
          ))}
        </fieldset>
      ) : null}
      {view.effectiveSource ? (
        <EventRegisterBankTransferInstructions
          title={view.effectiveSource.label || instructionsTitle}
          instructions={view.effectiveSource.instructions}
          surfaceVariant={surfaceVariant}
        />
      ) : null}
    </div>
  );
}
