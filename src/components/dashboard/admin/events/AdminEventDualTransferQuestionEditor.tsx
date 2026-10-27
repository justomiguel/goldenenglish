"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminEventDualTransferLabels } from "@/components/dashboard/admin/events/AdminEventDualTransferFields";
import type {
  EventBankTransferSourcesConfig,
  EventTransferQuestionOptionTarget,
  EventTransferSourceKey,
} from "@/lib/events/eventBankTransferSources";

function targetLabel(
  target: EventTransferQuestionOptionTarget,
  labels: AdminEventDualTransferLabels,
): string {
  if (target === "source_1") return labels.targetSource1;
  if (target === "source_2") return labels.targetSource2;
  if (target === "global") return labels.targetGlobal;
  return labels.targetAll;
}

interface AdminEventDualTransferQuestionEditorProps {
  config: EventBankTransferSourcesConfig;
  labels: AdminEventDualTransferLabels;
  onChange: (partial: Partial<EventBankTransferSourcesConfig>) => void;
}

export function AdminEventDualTransferQuestionEditor({
  config,
  labels,
  onChange,
}: AdminEventDualTransferQuestionEditorProps) {
  const targets: EventTransferQuestionOptionTarget[] = [
    ...config.included,
    ...(config.included.length > 1 ? (["all"] as const) : []),
  ];

  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="event-transfer-question">{labels.questionPromptLabel}</Label>
        <Input
          id="event-transfer-question"
          value={config.questionPrompt}
          onChange={(event) => onChange({ questionPrompt: event.target.value })}
          className="mt-1"
        />
      </div>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.optionsLabel}</p>
      {config.questionOptions.map((option, index) => (
        <div key={option.id} className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <Input
            aria-label={labels.optionLabel}
            value={option.label}
            onChange={(event) => {
              const questionOptions = config.questionOptions.map((item, itemIndex) =>
                itemIndex === index ? { ...item, label: event.target.value } : item,
              );
              onChange({ questionOptions });
            }}
          />
          <select
            aria-label={labels.targetLabel}
            value={targets.includes(option.target) ? option.target : (targets[0] ?? "source_1")}
            onChange={(event) => {
              const target = event.target.value as EventTransferSourceKey | "all";
              const questionOptions = config.questionOptions.map((item, itemIndex) =>
                itemIndex === index ? { ...item, target } : item,
              );
              onChange({ questionOptions });
            }}
            className="min-h-11 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
          >
            {targets.map((target) => (
              <option key={target} value={target}>
                {targetLabel(target, labels)}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="ghost"
            aria-label={labels.removeOption}
            title={labels.removeOption}
            onClick={() =>
              onChange({
                questionOptions: config.questionOptions.filter((item) => item.id !== option.id),
              })
            }
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          onChange({
            questionOptions: [
              ...config.questionOptions,
              { id: `opt-${crypto.randomUUID()}`, label: "", target: config.included[0] ?? "source_1" },
            ],
          })
        }
      >
        <Plus className="h-4 w-4" aria-hidden />
        {labels.addOption}
      </Button>
    </div>
  );
}
