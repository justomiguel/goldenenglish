import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countRegistrationInboxFilters,
  emptyRegistrationInboxCounts,
  type RegistrationInboxCounts,
} from "@/lib/register/countRegistrationInboxFilters";
import { requestedRegistrationSectionIds } from "@/lib/register/requestedRegistrationSectionIds";
import { loadAllChargingSectionIds } from "@/lib/register/markRegistrationRowsEnrollmentFee";
import { snapshotTotalFromUnknown } from "@/lib/register/registrationIntake";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

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

export async function loadRegistrationInboxCounts(
  supabase: SupabaseClient,
): Promise<RegistrationInboxCounts> {
  const charging = new Set(await loadAllChargingSectionIds(supabase));
  const rows: CountRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("registrations")
      .select(COLUMNS)
      .neq("status", "enrolled")
      .range(from, from + PAGE - 1);
    if (error) {
      logSupabaseClientError("loadRegistrationInboxCounts", error);
      return emptyRegistrationInboxCounts();
    }
    const page = (data ?? []) as unknown as CountRow[];
    rows.push(...page);
    if (page.length < PAGE) break;
    from += PAGE;
  }
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
