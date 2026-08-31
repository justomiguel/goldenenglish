export function normalizeRespondentEmail(email: string | null | undefined): string | null {
  const trimmed = String(email ?? "").trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

export function hasExistingResponse(
  rows: ReadonlyArray<{ respondentUserId: string | null; respondentEmail: string | null }>,
  identity: { userId: string | null; email: string | null },
): boolean {
  if (identity.userId) {
    return rows.some((row) => row.respondentUserId === identity.userId);
  }
  const email = normalizeRespondentEmail(identity.email);
  if (!email) return false;
  return rows.some((row) => normalizeRespondentEmail(row.respondentEmail) === email);
}
