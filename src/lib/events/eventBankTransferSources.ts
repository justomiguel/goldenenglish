import { z } from "zod";
import { sanitizeEventBankTransferInstructions } from "@/lib/events/sanitizeEventBankTransferInstructions";

export type EventTransferSourceKey = "source_1" | "source_2" | "global";
export type EventDualTransferMode = "choose" | "by_question";
export type EventTransferQuestionOptionTarget = EventTransferSourceKey | "all";

export interface EventTransferQuestionOption {
  id: string;
  label: string;
  target: EventTransferQuestionOptionTarget;
}

export interface EventTransferSourceItem {
  label: string;
  instructions: string;
}

export interface EventBankTransferSourcesConfig {
  enabled: boolean;
  mode: EventDualTransferMode;
  included: EventTransferSourceKey[];
  source1: EventTransferSourceItem;
  source2: EventTransferSourceItem;
  globalLabel: string;
  questionPrompt: string;
  questionOptions: EventTransferQuestionOption[];
}

export interface ResolvedEventTransferSource {
  key: EventTransferSourceKey;
  label: string;
  instructions: string;
}

const optionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  label: z.string().trim().max(160),
  target: z.enum(["source_1", "source_2", "global", "both", "all"]),
});

const sourceItemSchema = z.object({
  label: z.string().max(120).default(""),
  instructions: z.string().max(4000).default(""),
});

const configSchema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(["both", "source_1", "source_2", "by_question", "choose"]).default("choose"),
  included: z.array(z.enum(["source_1", "source_2", "global"])).max(3).optional(),
  source1: sourceItemSchema.default({ label: "", instructions: "" }),
  source2: sourceItemSchema.default({ label: "", instructions: "" }),
  globalLabel: z.string().max(120).default(""),
  questionPrompt: z.string().max(240).default(""),
  questionOptions: z.array(optionSchema).max(20).default([]),
});

function normalizeTarget(target: string): EventTransferQuestionOptionTarget {
  if (target === "both" || target === "all") return "all";
  if (target === "global" || target === "source_2") return target;
  return "source_1";
}

function normalizeIncluded(
  mode: string,
  included: EventTransferSourceKey[] | undefined,
): EventTransferSourceKey[] {
  const unique = [...new Set(included ?? [])];
  if (unique.length > 0) return unique;
  if (mode === "source_1") return ["source_1"];
  if (mode === "source_2") return ["source_2"];
  return ["source_1", "source_2"];
}

export function createDefaultEventBankTransferSourcesConfig(): EventBankTransferSourcesConfig {
  return {
    enabled: false,
    mode: "choose",
    included: ["source_1", "source_2"],
    source1: { label: "", instructions: "" },
    source2: { label: "", instructions: "" },
    globalLabel: "",
    questionPrompt: "",
    questionOptions: [
      { id: "opt-1", label: "", target: "source_1" },
      { id: "opt-2", label: "", target: "source_2" },
    ],
  };
}

export function parseEventBankTransferSourcesConfig(
  raw: unknown,
): EventBankTransferSourcesConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  return {
    enabled: data.enabled,
    mode: data.mode === "by_question" ? "by_question" : "choose",
    included: normalizeIncluded(data.mode, data.included),
    source1: data.source1,
    source2: data.source2,
    globalLabel: data.globalLabel.trim(),
    questionPrompt: data.questionPrompt,
    questionOptions: data.questionOptions.map((option) => ({
      ...option,
      target: normalizeTarget(option.target),
    })),
  };
}

export function sanitizeEventBankTransferSourcesConfig(
  raw: unknown,
): EventBankTransferSourcesConfig | null {
  const parsed = parseEventBankTransferSourcesConfig(raw);
  if (!parsed || !parsed.enabled) return null;

  const source1Instructions = sanitizeEventBankTransferInstructions(parsed.source1.instructions) ?? "";
  const source2Instructions = sanitizeEventBankTransferInstructions(parsed.source2.instructions) ?? "";

  return {
    enabled: true,
    mode: parsed.mode,
    included: parsed.included,
    source1: {
      label: parsed.source1.label.trim().slice(0, 120),
      instructions: source1Instructions,
    },
    source2: {
      label: parsed.source2.label.trim().slice(0, 120),
      instructions: source2Instructions,
    },
    globalLabel: parsed.globalLabel.trim().slice(0, 120),
    questionPrompt: parsed.questionPrompt.trim().slice(0, 240),
    questionOptions: parsed.questionOptions
      .map((opt) => ({
        id: opt.id.trim(),
        label: opt.label.trim().slice(0, 160),
        target: opt.target,
      }))
      .filter((opt) => opt.id.length > 0 && opt.label.length > 0),
  };
}
