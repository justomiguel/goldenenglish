import { describe, expect, it } from "vitest";
import { ADMIN_NAV_LUCIDE_ICONS } from "@/lib/dashboard/adminNavLucideIcons";
import {
  listAdminGlossaryGroups,
  listAdminGlossaryTerms,
  termsByGlossaryGroup,
} from "@/lib/admin-tutorials/glossary";

describe("admin glossary catalog", () => {
  it("lists every group with at least one term", () => {
    const groups = listAdminGlossaryGroups();
    expect(groups.length).toBeGreaterThanOrEqual(4);
    for (const group of groups) {
      expect(termsByGlossaryGroup(group).length).toBeGreaterThan(0);
    }
  });

  it("keeps unique term ids and dict keys aligned", () => {
    const terms = listAdminGlossaryTerms();
    const ids = terms.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const term of terms) {
      expect(term.dictKey).toBe(term.id);
    }
  });

  it("uses admin sidebar Lucide icons for every term", () => {
    for (const term of listAdminGlossaryTerms()) {
      expect(term.icon in ADMIN_NAV_LUCIDE_ICONS).toBe(true);
    }
  });

  it("only references related terms that exist in the catalog", () => {
    const known = new Set(listAdminGlossaryTerms().map((t) => t.id));
    for (const term of listAdminGlossaryTerms()) {
      for (const rel of term.related ?? []) {
        expect(known.has(rel)).toBe(true);
      }
    }
  });
});
