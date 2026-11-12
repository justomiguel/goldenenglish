import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countRegistrationInboxFilters,
  emptyRegistrationInboxCounts,
  type RegistrationInboxCounts,
} from "@/lib/register/countRegistrationInboxFilters";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { loadAllChargingSectionIds } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { snapshotTotalFromUnknown } from "@/lib/register/registrationIntake";
import { registrationBelongsToCohort } from "@/lib/register/registrationCohortMembership";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  activeSectionCohortIds,
  loadActiveSectionFacts,
  loadSectionCohortById,
} from "@/lib/dashboard/registrationCohortFacts";

export type { RegistrationInboxCounts };

const PAGE = 1000;
const COLUMNS = [
  "status", "intake_state", "fee_snapshot", "fee_captured",
  "enrollment_fee_mail_sent_at", "preferred_section_id",
  "additional_section_ids", "accepted_student_id",
].join(", ");

type CountRow = {
  status: string;
  intake_state?: unknown;
  fee_snapshot?: unknown;
  fee_captured?: unknown;
  enrollment_fee_mail_sent_at?: unknown;
  preferred_section_id?: string | null;
  additional_section_ids?: string[] | null;
  accepted_student_id?: unknown;
};

export type RegistrationCohortScope = {
  selectedCohortId: string;
  openCohortId: string;
};

async function readRows(supabase: SupabaseClient, excludeEnrolled: boolean): Promise<CountRow[] | null> {
  const rows: CountRow[] = [];
  let from = 0;
  for (;;) {
    let query = supabase.from("registrations").select(COLUMNS);
    if (excludeEnrolled) query = query.neq("status", "enrolled");
    const { data, error } = await query.range(from, from + PAGE - 1);
    if (error) {
      logSupabaseClientError("loadRegistrationInboxCounts", error);
      return null;
    }
    const page = (data ?? []) as unknown as CountRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

function countRows(rows: CountRow[], charging: ReadonlySet<string>): RegistrationInboxCounts {
  return countRegistrationInboxFilters(
    rows.map((row) => ({
      ...row,
      chargesEnrollmentFee:
        snapshotTotalFromUnknown(row.fee_snapshot) > 0 ||
        requestedRegistrationSectionIds({
          preferred_section_id: row.preferred_section_id ?? null,
          additionalSectionIds: row.additional_section_ids ?? [],
        }).some((id) => charging.has(id)),
    })),
  );
}

export async function loadRegistrationInboxCounts(
  supabase: SupabaseClient,
  scope?: RegistrationCohortScope,
): Promise<RegistrationInboxCounts> {
  const charging = new Set(await loadAllChargingSectionIds(supabase));
  const rows = await readRows(supabase, !scope);
  if (!rows) return emptyRegistrationInboxCounts();
  if (!scope) return countRows(rows, charging);

  const [sectionCohorts, facts] = await Promise.all([
    loadSectionCohortById(supabase),
    loadActiveSectionFacts(
      supabase,
      rows.flatMap((row) =>
        typeof row.accepted_student_id === "string" ? [row.accepted_student_id] : [],
      ),
    ),
  ]);
  const kept = rows.filter((row) => {
    const studentId = typeof row.accepted_student_id === "string" ? row.accepted_student_id : null;
    const preferredId = row.preferred_section_id ?? null;
    return registrationBelongsToCohort({
      selectedCohortId: scope.selectedCohortId,
      openCohortId: scope.openCohortId,
      status: String(row.status ?? ""),
      preferredSectionCohortId: preferredId ? (sectionCohorts.get(preferredId) ?? null) : null,
      activeSectionCohortIds: activeSectionCohortIds(facts, studentId),
    });
  });
  return countRows(kept, charging);
}
