import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface SectionEnrollmentLinkState {
  token: string | null;
  active: boolean;
  leadCount: number;
}

const EMPTY_STATE: SectionEnrollmentLinkState = {
  token: null,
  active: false,
  leadCount: 0,
};

/**
 * Link state for the teacher and admin panels.
 *
 * `section_enrollment_links` has no grants and no policies, so it cannot be read over
 * PostgREST at all — this RPC is the only window onto it, and it enforces the
 * admin-or-section-staff check itself. A section without a link and a caller without
 * permission both yield no rows, and that ambiguity is intentional.
 */
export async function loadSectionEnrollmentLinkState(
  supabase: SupabaseClient,
  sectionId: string,
): Promise<SectionEnrollmentLinkState> {
  const { data, error } = await supabase.rpc("section_enrollment_link_state", {
    p_section_id: sectionId,
  });

  if (error) {
    logSupabaseClientError("loadSectionEnrollmentLinkState", error, {
      section_id: sectionId,
    });
    return EMPTY_STATE;
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    | { token?: string | null; is_active?: boolean | null; lead_count?: unknown }
    | null
    | undefined;
  if (!row?.token) return EMPTY_STATE;

  // lead_count is a BIGINT, which PostgREST may serialise as a string.
  const count = Number(row.lead_count ?? 0);

  return {
    token: String(row.token),
    active: row.is_active === true,
    leadCount: Number.isFinite(count) ? count : 0,
  };
}
