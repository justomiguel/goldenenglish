import { revealFailureCode } from "@/lib/errors/revealFailureCode";
import type { SectionMoveCollision } from "@/lib/academics/planSectionMoveCarry";

export function formatCarryCollisionDetail(collision: SectionMoveCollision, locale: string): string {
  if (collision.kind === "scholarship") return `${collision.discountPercent}%`;
  const date = new Date(Date.UTC(collision.year, collision.month - 1, 1));
  const month = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(date);
  return `${month} ${collision.year}`;
}

export function sectionMoveCarryFailureMessage(
  code: string,
  detail: string | null | undefined,
  sentences: Partial<Record<string, string>> | undefined,
  unknownTemplate: string,
): string {
  const token = code.trim();
  if (!token) return unknownTemplate.replaceAll("{{code}}", "save_failed");
  const template = sentences?.[token];
  if (!template) return unknownTemplate.replaceAll("{{code}}", token);
  const filled = template.replaceAll("{{detail}}", detail?.trim() ?? "");
  return revealFailureCode(filled, token);
}

export function mapSectionMoveCarryRpcError(message: string): { code: string; detail?: string } {
  if (message.includes("CARRY_CHOICE_MISSING")) {
    const raw = message.split("CARRY_CHOICE_MISSING:")[1] ?? "";
    const detail = raw.split(/[\s"]/)[0]?.trim();
    return { code: "carry_choice_missing", detail: detail || undefined };
  }
  if (message.includes("SECTION_MOVE_SAME") || message.includes("ACADEMIC_ALREADY_ACTIVE_IN_SECTION")) {
    return { code: "section_move_same" };
  }
  if (message.includes("ACADEMIC_SCHEDULE_OVERLAP")) return { code: "SCHEDULE_OVERLAP" };
  if (message.includes("ACADEMIC_CAPACITY_EXCEEDED")) return { code: "CAPACITY_EXCEEDED" };
  if (message.includes("ACADEMIC_NOT_ADMIN")) return { code: "forbidden" };
  if (message.includes("SECTION_MOVE_NOT_FOUND") || message.includes("ACADEMIC_SECTION_NOT_FOUND")) {
    return { code: "not_found" };
  }
  return { code: "save_failed" };
}
