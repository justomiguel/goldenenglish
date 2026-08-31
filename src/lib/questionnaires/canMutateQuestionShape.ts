export function canMutateQuestionShape(input: {
  hasAnswers: boolean;
  typeChanged: boolean;
  optionsChanged: boolean;
}): { ok: true } | { ok: false; code: "shape_locked" } {
  if (input.hasAnswers && (input.typeChanged || input.optionsChanged)) {
    return { ok: false, code: "shape_locked" };
  }
  return { ok: true };
}

export function optionsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
