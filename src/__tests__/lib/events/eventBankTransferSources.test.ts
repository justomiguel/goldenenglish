// REGRESSION CHECK: Dual bank transfer resolution must preserve single-source fallback
// when disabled and strictly validate routing option + source key when enabled.
import { describe, expect, it } from "vitest";
import {
  createDefaultEventBankTransferSourcesConfig,
  parseEventBankTransferSourcesConfig,
  sanitizeEventBankTransferSourcesConfig,
  type EventBankTransferSourcesConfig,
} from "@/lib/events/eventBankTransferSources";
import {
  resolveEventTransferPresentation,
  validateEventTransferSelection,
} from "@/lib/events/eventTransferPresentation";

const sampleDualConfig: EventBankTransferSourcesConfig = {
  enabled: true,
  mode: "by_question",
  included: ["source_1", "source_2"],
  source1: {
    label: "Instituto Golden",
    instructions: "CBU 1111111111 - Alias GOLDEN.EVENTO",
  },
  source2: {
    label: "Instituto Nago",
    instructions: "CBU 2222222222 - Alias NAGO.EVENTO",
  },
  globalLabel: "",
  questionPrompt: "¿Por cuál instituto asistes?",
  questionOptions: [
    { id: "opt-1", label: "Soy alumno de Golden", target: "source_1" },
    { id: "opt-2", label: "Soy alumno de Nago", target: "source_2" },
    { id: "opt-3", label: "Invitado externo", target: "all" },
  ],
};

describe("eventBankTransferSources", () => {
  it("creates a default disabled config and parses valid JSONB", () => {
    const def = createDefaultEventBankTransferSourcesConfig();
    expect(def.enabled).toBe(false);
    expect(parseEventBankTransferSourcesConfig(null)).toBeNull();
    expect(parseEventBankTransferSourcesConfig("invalid")).toBeNull();

    const parsed = parseEventBankTransferSourcesConfig(sampleDualConfig);
    expect(parsed).toEqual(sampleDualConfig);
  });

  it("sanitizes config and returns null when disabled", () => {
    expect(
      sanitizeEventBankTransferSourcesConfig({
        ...sampleDualConfig,
        enabled: false,
      }),
    ).toBeNull();

    const sanitized = sanitizeEventBankTransferSourcesConfig({
      ...sampleDualConfig,
      source1: { label: "  Golden  ", instructions: "  CBU 111  " },
      questionPrompt: "  ¿Instituto?  ",
      questionOptions: [
        { id: "opt-1", label: "  Opción 1  ", target: "source_1" },
        { id: "empty", label: "   ", target: "source_2" },
      ],
    });
    expect(sanitized?.source1.label).toBe("Golden");
    expect(sanitized?.source1.instructions).toBe("CBU 111");
    expect(sanitized?.questionPrompt).toBe("¿Instituto?");
    expect(sanitized?.questionOptions).toHaveLength(1);
  });

  it("resolves presentation for both, single source, and by_question modes", () => {
    const bothView = resolveEventTransferPresentation({
      config: { ...sampleDualConfig, mode: "choose" },
      bankTransferInstructions: null,
      selectedSourceKey: "source_2",
    });
    expect(bothView.isDualActive).toBe(true);
    expect(bothView.askRoutingQuestion).toBe(false);
    expect(bothView.requiresSourcePicker).toBe(true);
    expect(bothView.effectiveSource?.key).toBe("source_2");

    const single1View = resolveEventTransferPresentation({
      config: { ...sampleDualConfig, mode: "choose", included: ["source_1"] },
      bankTransferInstructions: null,
    });
    expect(single1View.requiresSourcePicker).toBe(false);
    expect(single1View.effectiveSource?.key).toBe("source_1");

    const questionUnselected = resolveEventTransferPresentation({
      config: sampleDualConfig,
      bankTransferInstructions: null,
    });
    expect(questionUnselected.askRoutingQuestion).toBe(true);
    expect(questionUnselected.availableSources).toHaveLength(0);
    expect(questionUnselected.effectiveSource).toBeNull();

    const questionToSource1 = resolveEventTransferPresentation({
      config: sampleDualConfig,
      bankTransferInstructions: null,
      selectedOptionId: "opt-1",
    });
    expect(questionToSource1.requiresSourcePicker).toBe(false);
    expect(questionToSource1.effectiveSource?.key).toBe("source_1");

    const questionToBoth = resolveEventTransferPresentation({
      config: sampleDualConfig,
      bankTransferInstructions: null,
      selectedOptionId: "opt-3",
      selectedSourceKey: "source_2",
    });
    expect(questionToBoth.requiresSourcePicker).toBe(true);
    expect(questionToBoth.effectiveSource?.key).toBe("source_2");
  });

  it("validates transfer selection on enrollment", () => {
    expect(
      validateEventTransferSelection({
        requiresTransferReceipt: false,
        config: sampleDualConfig,
      }),
    ).toEqual({ ok: true, selection: null });

    expect(
      validateEventTransferSelection({
        requiresTransferReceipt: true,
        config: sampleDualConfig,
      }),
    ).toEqual({ ok: false, code: "transfer_option_required" });

    expect(
      validateEventTransferSelection({
        requiresTransferReceipt: true,
        config: sampleDualConfig,
        selectedOptionId: "opt-3",
      }),
    ).toEqual({ ok: false, code: "transfer_source_required" });

    expect(
      validateEventTransferSelection({
        requiresTransferReceipt: true,
        config: sampleDualConfig,
        selectedOptionId: "opt-3",
        selectedSourceKey: "source_2",
      }),
    ).toEqual({
      ok: true,
      selection: {
        sourceKey: "source_2",
        sourceLabel: "Instituto Nago",
        questionAnswer: "Invitado externo",
      },
    });
  });

  it("normalizes a legacy mode and routes the institute account from finance text", () => {
    const legacy = parseEventBankTransferSourcesConfig({
      enabled: true,
      mode: "both",
      source1: sampleDualConfig.source1,
      source2: sampleDualConfig.source2,
      questionOptions: [{ id: "opt-3", label: "Invitado externo", target: "both" }],
    });
    expect(legacy?.mode).toBe("choose");
    expect(legacy?.included).toEqual(["source_1", "source_2"]);
    expect(legacy?.questionOptions[0]?.target).toBe("all");
    expect(parseEventBankTransferSourcesConfig("nope")).toBeNull();
    expect(parseEventBankTransferSourcesConfig({ enabled: true, mode: "nope" })).toBeNull();

    const onlyFirst = parseEventBankTransferSourcesConfig({
      enabled: true,
      mode: "source_1",
      source1: sampleDualConfig.source1,
      source2: sampleDualConfig.source2,
      questionOptions: [{ id: "opt-g", label: "Global", target: "global" }],
    });
    expect(onlyFirst?.included).toEqual(["source_1"]);
    expect(onlyFirst?.questionOptions[0]?.target).toBe("global");

    const onlySecond = parseEventBankTransferSourcesConfig({
      enabled: true,
      mode: "source_2",
      source1: sampleDualConfig.source1,
      source2: sampleDualConfig.source2,
      questionOptions: [{ id: "opt-x", label: "Otra", target: "source_2" }],
    });
    expect(onlySecond?.included).toEqual(["source_2"]);
    expect(onlySecond?.questionOptions[0]?.target).toBe("source_2");

    const globalView = resolveEventTransferPresentation({
      config: {
        ...sampleDualConfig,
        mode: "choose",
        included: ["source_1", "global"],
        globalLabel: "Instituto",
      },
      bankTransferInstructions: "event override",
      globalTransferInstructions: "CBU GLOBAL",
      selectedSourceKey: "global",
    });
    expect(globalView.availableSources.map((source) => source.key)).toEqual(["source_1", "global"]);
    expect(globalView.effectiveSource).toMatchObject({
      key: "global",
      label: "Instituto",
      instructions: "CBU GLOBAL",
    });
  });
});
