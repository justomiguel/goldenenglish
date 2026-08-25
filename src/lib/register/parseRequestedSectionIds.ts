import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";

export type ParseRequestedSectionsOk = {
  ok: true;
  preferredSectionId: string | null;
  additionalSectionIds: string[];
  undecided: boolean;
};

export type ParseRequestedSectionsErr = {
  ok: false;
  reason: "undecided_with_extras";
};

export function parseRequestedSectionIds(input: {
  selectedIds: string[];
  sectionOptionsOrder: string[];
  lockedPreferredId?: string | null;
  allowUndecided: boolean;
}): ParseRequestedSectionsOk | ParseRequestedSectionsErr {
  const selected: string[] = [];
  for (const id of input.selectedIds) {
    const t = id.trim();
    if (t && !selected.includes(t)) selected.push(t);
  }

  const wantsUndecided =
    input.allowUndecided && selected.includes(REGISTRATION_UNDECIDED_FORM_VALUE);
  const concrete = selected.filter((id) => id !== REGISTRATION_UNDECIDED_FORM_VALUE);
  const allowed = new Set(input.sectionOptionsOrder);
  const validConcrete = concrete.filter((id) => allowed.has(id));

  if (wantsUndecided && validConcrete.length > 0) {
    return { ok: false, reason: "undecided_with_extras" };
  }
  if (wantsUndecided) {
    return {
      ok: true,
      preferredSectionId: null,
      additionalSectionIds: [],
      undecided: true,
    };
  }

  const locked = input.lockedPreferredId?.trim() || null;
  if (locked) {
    const extras = validConcrete.filter((id) => id !== locked);
    return {
      ok: true,
      preferredSectionId: locked,
      additionalSectionIds: extras,
      undecided: false,
    };
  }

  const inOrder = input.sectionOptionsOrder.filter((id) => validConcrete.includes(id));
  const preferred = inOrder[0] ?? null;
  return {
    ok: true,
    preferredSectionId: preferred,
    additionalSectionIds: preferred ? inOrder.slice(1) : [],
    undecided: false,
  };
}
