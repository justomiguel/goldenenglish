import { describe, it, expect } from "vitest";
import { emailTemplateBodyPrefersCodeEditor } from "@/lib/email/emailTemplateBodyPrefersCodeEditor";

describe("emailTemplateBodyPrefersCodeEditor", () => {
  it("returns false for simple paragraph HTML", () => {
    expect(emailTemplateBodyPrefersCodeEditor("<p>Hola</p>")).toBe(false);
  });

  it("returns true when a div wrapper is present", () => {
    expect(emailTemplateBodyPrefersCodeEditor('<div class="x">a</div>')).toBe(true);
  });

  it("returns false for empty or whitespace", () => {
    expect(emailTemplateBodyPrefersCodeEditor("")).toBe(false);
    expect(emailTemplateBodyPrefersCodeEditor("   ")).toBe(false);
  });
});
