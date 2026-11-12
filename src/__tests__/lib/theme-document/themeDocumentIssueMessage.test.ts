import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { themeDocumentIssueMessage } from "@/lib/theme-document/themeDocumentIssueMessage";

const locales = [en, es, pt] as const;

describe("themeDocumentIssueMessage", () => {
  it("shows a known code, a path, and the raw unknown code", () => {
    for (const dict of locales) {
      const issues = dict.admin.themeDocument.issue;
      const known = themeDocumentIssueMessage(issues, "draft_missing");
      expect(known).toContain("draft_missing");
      expect(known).not.toBe(issues.unknown);

      const locked = themeDocumentIssueMessage(issues, "field_locked", { path: "tokens.color.primary" });
      expect(locked).toContain("tokens.color.primary");
      expect(locked).toContain("field_locked");

      const unknown = themeDocumentIssueMessage(issues, "not_a_real_code");
      expect(unknown).toContain("not_a_real_code");
    }
  });
});
