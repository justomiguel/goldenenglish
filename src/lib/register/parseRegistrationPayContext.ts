export type RegistrationPayContext = {
  firstName: string;
  lastName: string;
  status: string;
  intakeState: string;
  feeCaptured: boolean;
  snapshotTotal: number;
  snapshotCurrency: string;
  preferredSectionId: string | null;
  additionalSectionIds: string[];
};

export function parseRegistrationPayContext(raw: unknown): RegistrationPayContext | null {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const firstName = String(r.first_name ?? "").trim();
  const lastName = String(r.last_name ?? "").trim();
  if (!firstName && !lastName) return null;
  const snapshot = (r.fee_snapshot ?? {}) as { total?: unknown; currency?: unknown };
  const total = Number(snapshot.total ?? 0);
  return {
    firstName,
    lastName,
    status: String(r.status ?? "new"),
    intakeState: String(r.intake_state ?? "none"),
    feeCaptured: r.fee_captured === true,
    snapshotTotal: Number.isFinite(total) ? total : 0,
    snapshotCurrency: String(snapshot.currency ?? "USD"),
    preferredSectionId:
      r.preferred_section_id == null ? null : String(r.preferred_section_id),
    additionalSectionIds: Array.isArray(r.additional_section_ids)
      ? r.additional_section_ids.map((id) => String(id)).filter(Boolean)
      : [],
  };
}

export function requestedSectionIdsFromPayContext(
  context: Pick<RegistrationPayContext, "preferredSectionId" | "additionalSectionIds">,
): string[] {
  return [
    context.preferredSectionId,
    ...context.additionalSectionIds,
  ].filter((id): id is string => Boolean(id));
}
