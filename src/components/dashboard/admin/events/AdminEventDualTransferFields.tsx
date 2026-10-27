"use client";

import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { AdminEventDualTransferQuestionEditor } from "@/components/dashboard/admin/events/AdminEventDualTransferQuestionEditor";
import type {
  EventBankTransferSourcesConfig,
  EventDualTransferMode,
  EventTransferSourceItem,
  EventTransferSourceKey,
} from "@/lib/events/eventBankTransferSources";

export interface AdminEventDualTransferLabels {
  enabledLabel: string;
  useGlobalSingle?: string;
  useOtherAccounts?: string;
  useGlobalSingleActiveHint?: string;
  customSingleLabel?: string;
  includeLabel: string;
  includeSource1: string;
  includeSource2: string;
  includeGlobal: string;
  globalEmpty: string;
  globalLabelLabel: string;
  globalPreviewLabel: string;
  modeLabel: string;
  modeChoose: string;
  modeByQuestion: string;
  source1Title: string;
  source2Title: string;
  sourceLabelLabel: string;
  instructionsLabel: string;
  questionPromptLabel: string;
  optionsLabel: string;
  optionLabel: string;
  targetLabel: string;
  targetSource1: string;
  targetSource2: string;
  targetGlobal: string;
  targetAll: string;
  addOption: string;
  removeOption: string;
}

const ALL_INCLUDE_KEYS: EventTransferSourceKey[] = ["source_1", "source_2", "global"];

interface AdminEventDualTransferFieldsProps {
  config: EventBankTransferSourcesConfig;
  globalInstructions?: string | null;
  disabled?: boolean;
  labels: AdminEventDualTransferLabels;
  onChange: (next: EventBankTransferSourcesConfig) => void;
}

function includeLabel(key: EventTransferSourceKey, labels: AdminEventDualTransferLabels): string {
  if (key === "source_1") return labels.includeSource1;
  if (key === "source_2") return labels.includeSource2;
  return labels.includeGlobal;
}

export function AdminEventDualTransferFields({
  config,
  globalInstructions = null,
  disabled,
  labels,
  onChange,
}: AdminEventDualTransferFieldsProps) {
  const globalText = globalInstructions?.trim() ?? "";
  const hasGlobal = globalText.length > 0;
  const visibleIncludeKeys: EventTransferSourceKey[] = hasGlobal
    ? ALL_INCLUDE_KEYS
    : ["source_1", "source_2"];
  const effectiveIncluded = hasGlobal
    ? config.included
    : config.included.filter((key) => key !== "global");
  const showAssignment = effectiveIncluded.length > 1;

  function patch(partial: Partial<EventBankTransferSourcesConfig>) {
    onChange({ ...config, ...partial });
  }

  function patchSource(key: "source1" | "source2", partial: Partial<EventTransferSourceItem>) {
    patch({ [key]: { ...config[key], ...partial } });
  }

  function toggleIncluded(key: EventTransferSourceKey) {
    const next = effectiveIncluded.includes(key)
      ? effectiveIncluded.filter((item) => item !== key)
      : [...effectiveIncluded, key];
    patch({ included: visibleIncludeKeys.filter((item) => next.includes(item)) });
  }

  return (
    <fieldset
      className="space-y-3 rounded-md border border-[var(--color-border)] p-3 disabled:opacity-50 md:col-span-2"
      disabled={disabled}
    >
      <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => patch({ enabled: event.target.checked })}
        />
        {labels.enabledLabel}
      </label>
      {config.enabled ? (
        <>
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.includeLabel}</p>
            <div className={visibleIncludeKeys.length > 2 ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3 md:grid-cols-2"}>
              {visibleIncludeKeys.map((key) => {
                const isChecked = effectiveIncluded.includes(key);
                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 ${
                      isChecked
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                        : "border-[var(--color-border)] bg-[var(--color-background)]"
                    }`}
                  >
                    <label className="flex min-h-9 items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleIncluded(key)}
                      />
                      {includeLabel(key, labels)}
                    </label>
                    {key === "source_1" && isChecked ? (
                      <div className="mt-2 pl-6">
                        <SourceEditor
                          idPrefix="event-transfer-source-1"
                          source={config.source1}
                          labels={labels}
                          onChange={(partial) => patchSource("source1", partial)}
                        />
                      </div>
                    ) : null}
                    {key === "source_2" && isChecked ? (
                      <div className="mt-2 pl-6">
                        <SourceEditor
                          idPrefix="event-transfer-source-2"
                          source={config.source2}
                          labels={labels}
                          onChange={(partial) => patchSource("source2", partial)}
                        />
                      </div>
                    ) : null}
                    {key === "global" ? (
                      <div className="mt-2 space-y-2 pl-6">
                        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/15 p-2.5">
                          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                            {labels.globalPreviewLabel}
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm text-[var(--color-foreground)]">
                            {globalText}
                          </p>
                        </div>
                        {isChecked ? (
                          <div>
                            <Label htmlFor="event-transfer-global-label">{labels.globalLabelLabel}</Label>
                            <Input
                              id="event-transfer-global-label"
                              value={config.globalLabel}
                              onChange={(event) => patch({ globalLabel: event.target.value })}
                              className="mt-1"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          {showAssignment ? (
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.modeLabel}</p>
              <div className="mt-2 space-y-1">
                {(["choose", "by_question"] as EventDualTransferMode[]).map((mode) => (
                  <label
                    key={mode}
                    className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]"
                  >
                    <input
                      type="radio"
                      name="event-dual-transfer-mode"
                      checked={config.mode === mode}
                      onChange={() => patch({ mode })}
                    />
                    {mode === "choose" ? labels.modeChoose : labels.modeByQuestion}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
          {showAssignment && config.mode === "by_question" ? (
            <AdminEventDualTransferQuestionEditor
              config={{ ...config, included: effectiveIncluded }}
              labels={labels}
              onChange={patch}
            />
          ) : null}
        </>
      ) : null}
    </fieldset>
  );
}

function SourceEditor({
  idPrefix,
  source,
  labels,
  onChange,
}: {
  idPrefix: string;
  source: EventTransferSourceItem;
  labels: AdminEventDualTransferLabels;
  onChange: (partial: Partial<EventTransferSourceItem>) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor={`${idPrefix}-label`}>{labels.sourceLabelLabel}</Label>
        <Input
          id={`${idPrefix}-label`}
          value={source.label}
          onChange={(event) => onChange({ label: event.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-instructions`}>{labels.instructionsLabel}</Label>
        <textarea
          id={`${idPrefix}-instructions`}
          value={source.instructions}
          onChange={(event) => onChange({ instructions: event.target.value })}
          rows={4}
          className="mt-1 min-h-[96px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        />
      </div>
    </div>
  );
}
