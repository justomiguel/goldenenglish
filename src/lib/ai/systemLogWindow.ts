import type { AiMessage } from "@/lib/ai/languageModel";

export const SYSTEM_LOG_FOLD_CHARS = 24_000;

export type LogTurn = {
  id: string;
  role: "developer" | "user" | "assistant" | "summary";
  body: string;
  foldedAt: string | null;
};

export function latestSummary(turns: readonly LogTurn[]): LogTurn | null {
  return turns.filter((turn) => turn.role === "summary" && !turn.foldedAt).at(-1) ?? null;
}

export function unfoldedTurns(turns: readonly LogTurn[]): LogTurn[] {
  return turns.filter((turn) => turn.role !== "summary" && !turn.foldedAt);
}

export function windowChars(turns: readonly LogTurn[], extra: string): number {
  const summary = latestSummary(turns);
  const open = unfoldedTurns(turns);
  return (summary?.body.length ?? 0) + open.reduce((total, turn) => total + turn.body.length, 0) + extra.length;
}

export function needsFold(turns: readonly LogTurn[], extra: string): boolean {
  return unfoldedTurns(turns).length > 0 && windowChars(turns, extra) > SYSTEM_LOG_FOLD_CHARS;
}

export function promptMessages(turns: readonly LogTurn[], userText: string, instructions: string | null): AiMessage[] {
  const messages: AiMessage[] = [];
  if (instructions) messages.push({ role: "developer", content: instructions });
  const summary = latestSummary(turns);
  if (summary) messages.push({ role: "developer", content: summary.body });
  for (const turn of unfoldedTurns(turns)) {
    if (turn.role === "developer" || turn.role === "user" || turn.role === "assistant") {
      messages.push({ role: turn.role, content: turn.body });
    }
  }
  messages.push({ role: "user", content: userText });
  return messages;
}

export function foldPrompt(turns: readonly LogTurn[]): AiMessage[] {
  const summary = latestSummary(turns);
  const lines = unfoldedTurns(turns).map((turn) => `${turn.role}: ${turn.body}`).join("\n");
  const prior = summary ? `${summary.body}\n${lines}` : lines;
  return [
    { role: "developer", content: "Summarize this conversation so a later turn can continue. Keep the facts." },
    { role: "user", content: prior },
  ];
}
