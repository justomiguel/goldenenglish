export const MOZARTHITOS_FAQ_QUESTION_IDS = [
  "price",
  "programs",
  "age",
  "schedule",
  "babies",
  "online",
  "inPerson",
  "where",
  "instruments",
  "enroll",
  "siblings",
  "trial",
  "parents",
  "materials",
  "whatsapp",
  "inclusion",
] as const;

export function isMozarthitosFaqQuestionId(value: string): boolean {
  return (MOZARTHITOS_FAQ_QUESTION_IDS as readonly string[]).includes(value);
}
