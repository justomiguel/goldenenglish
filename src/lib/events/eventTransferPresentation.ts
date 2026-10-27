import type {
  EventBankTransferSourcesConfig,
  EventTransferQuestionOption,
  EventTransferSourceKey,
  ResolvedEventTransferSource,
} from "@/lib/events/eventBankTransferSources";

export interface EventTransferPresentation {
  isDualActive: boolean;
  askRoutingQuestion: boolean;
  questionPrompt: string;
  questionOptions: EventTransferQuestionOption[];
  selectedOption: EventTransferQuestionOption | null;
  availableSources: ResolvedEventTransferSource[];
  requiresSourcePicker: boolean;
  effectiveSource: ResolvedEventTransferSource | null;
  hasAnyTransferInstructions: boolean;
}

function sourceFromConfig(
  config: EventBankTransferSourcesConfig,
  key: EventTransferSourceKey,
  globalTransferInstructions: string | null,
  globalFallbackLabel: string,
): ResolvedEventTransferSource | null {
  if (key === "global") {
    const instructions = globalTransferInstructions?.trim() ?? "";
    if (!instructions) return null;
    return {
      key: "global",
      label: config.globalLabel.trim() || globalFallbackLabel,
      instructions,
    };
  }
  const item = key === "source_1" ? config.source1 : config.source2;
  const instructions = item.instructions.trim();
  if (!instructions) return null;
  return {
    key,
    label: item.label.trim() || (key === "source_1" ? "1" : "2"),
    instructions,
  };
}

function includedSources(
  config: EventBankTransferSourcesConfig,
  globalTransferInstructions: string | null,
  globalFallbackLabel: string,
): ResolvedEventTransferSource[] {
  return config.included.flatMap((key) => {
    const source = sourceFromConfig(config, key, globalTransferInstructions, globalFallbackLabel);
    return source ? [source] : [];
  });
}

export function resolveEventTransferPresentation(input: {
  config: EventBankTransferSourcesConfig | null;
  bankTransferInstructions: string | null;
  globalTransferInstructions?: string | null;
  globalFallbackLabel?: string;
  selectedOptionId?: string | null;
  selectedSourceKey?: string | null;
}): EventTransferPresentation {
  const config = input.config;
  const globalText = input.globalTransferInstructions ?? null;
  const fallbackLabel = input.globalFallbackLabel?.trim() || "Global";
  const pool = config ? includedSources(config, globalText, fallbackLabel) : [];
  const isDualActive = Boolean(config?.enabled && pool.length > 0);

  if (!isDualActive || !config) {
    return {
      isDualActive: false,
      askRoutingQuestion: false,
      questionPrompt: "",
      questionOptions: [],
      selectedOption: null,
      availableSources: [],
      requiresSourcePicker: false,
      effectiveSource: null,
      hasAnyTransferInstructions: Boolean(input.bankTransferInstructions?.trim()),
    };
  }

  const askRoutingQuestion = config.mode === "by_question" && config.questionOptions.length > 0;
  const selectedOption = askRoutingQuestion
    ? (config.questionOptions.find((option) => option.id === input.selectedOptionId) ?? null)
    : null;

  let availableSources: ResolvedEventTransferSource[] = [];
  if (!askRoutingQuestion) {
    availableSources = pool;
  } else if (selectedOption?.target === "all") {
    availableSources = pool;
  } else if (selectedOption) {
    const match = pool.find((source) => source.key === selectedOption.target);
    availableSources = match ? [match] : [];
  }

  const requiresSourcePicker = availableSources.length > 1;
  const effectiveSource = requiresSourcePicker
    ? (availableSources.find((source) => source.key === input.selectedSourceKey) ?? null)
    : (availableSources[0] ?? null);

  return {
    isDualActive: true,
    askRoutingQuestion,
    questionPrompt: config.questionPrompt,
    questionOptions: config.questionOptions,
    selectedOption,
    availableSources,
    requiresSourcePicker,
    effectiveSource,
    hasAnyTransferInstructions: true,
  };
}

export type ValidateEventTransferSelectionResult =
  | {
      ok: true;
      selection: {
        sourceKey: EventTransferSourceKey;
        sourceLabel: string;
        questionAnswer: string | null;
      } | null;
    }
  | { ok: false; code: "transfer_option_required" | "transfer_source_required" };

export function validateEventTransferSelection(input: {
  requiresTransferReceipt: boolean;
  config: EventBankTransferSourcesConfig | null;
  globalTransferInstructions?: string | null;
  globalFallbackLabel?: string;
  selectedOptionId?: string | null;
  selectedSourceKey?: string | null;
}): ValidateEventTransferSelectionResult {
  if (!input.requiresTransferReceipt) return { ok: true, selection: null };
  const view = resolveEventTransferPresentation({
    config: input.config,
    bankTransferInstructions: null,
    globalTransferInstructions: input.globalTransferInstructions,
    globalFallbackLabel: input.globalFallbackLabel,
    selectedOptionId: input.selectedOptionId,
    selectedSourceKey: input.selectedSourceKey,
  });
  if (!view.isDualActive) return { ok: true, selection: null };
  if (view.askRoutingQuestion && !view.selectedOption) {
    return { ok: false, code: "transfer_option_required" };
  }
  if (!view.effectiveSource) return { ok: false, code: "transfer_source_required" };
  return {
    ok: true,
    selection: {
      sourceKey: view.effectiveSource.key,
      sourceLabel: view.effectiveSource.label,
      questionAnswer: view.selectedOption?.label ?? null,
    },
  };
}
