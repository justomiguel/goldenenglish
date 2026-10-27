import type { SupabaseClient } from "@supabase/supabase-js";
import {
  REGISTRATION_LEVEL_INTEREST_UNDECIDED,
  REGISTRATION_UNDECIDED_FORM_VALUE,
} from "@/lib/register/registrationSectionConstants";
import { parseRequestedSectionIds } from "@/lib/register/parseRequestedSectionIds";

type SectionChoice = {
  preferred_section_id: string;
  additional_section_ids?: string[] | null;
};

export async function resolvePublicRegistrationSections(
  supabase: SupabaseClient,
  draft: SectionChoice,
  messages: { invalid: string; validation: string },
): Promise<
  | { ok: false; message: string }
  | {
      ok: true;
      sectionLabelForRow: string | null;
      preferredSectionId: string | null;
      additionalSectionIds: string[];
    }
> {
  const candidateIds = [draft.preferred_section_id, ...(draft.additional_section_ids ?? [])].filter(
    (id) => id && id !== REGISTRATION_UNDECIDED_FORM_VALUE,
  );
  const validPublicIds: string[] = [];
  for (const id of candidateIds) {
    const { data: sectionLabel, error: sectionRpcErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: id },
    );
    if (!sectionRpcErr && sectionLabel != null && String(sectionLabel).trim() !== "") {
      if (!validPublicIds.includes(id)) validPublicIds.push(id);
    }
  }

  const parsedSections = parseRequestedSectionIds({
    selectedIds: [draft.preferred_section_id, ...(draft.additional_section_ids ?? [])],
    sectionOptionsOrder: validPublicIds,
    allowUndecided: true,
  });
  if (!parsedSections.ok) return { ok: false, message: messages.validation };

  const preferredSectionId = parsedSections.preferredSectionId;
  const additionalSectionIds = parsedSections.additionalSectionIds;
  if (parsedSections.undecided) {
    return {
      ok: true,
      sectionLabelForRow: REGISTRATION_LEVEL_INTEREST_UNDECIDED,
      preferredSectionId,
      additionalSectionIds,
    };
  }
  if (preferredSectionId) {
    const { data: sectionLabel, error: sectionRpcErr } = await supabase.rpc(
      "registration_public_section_label",
      { p_section_id: preferredSectionId },
    );
    if (sectionRpcErr || sectionLabel == null || String(sectionLabel).trim() === "") {
      return { ok: false, message: messages.invalid };
    }
    return {
      ok: true,
      sectionLabelForRow: String(sectionLabel),
      preferredSectionId,
      additionalSectionIds,
    };
  }
  if (candidateIds.length > 0) return { ok: false, message: messages.invalid };
  return { ok: true, sectionLabelForRow: null, preferredSectionId, additionalSectionIds };
}
