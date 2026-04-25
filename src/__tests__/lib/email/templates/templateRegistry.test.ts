/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  EMAIL_TEMPLATE_CATEGORIES,
  getEmailTemplateDefinition,
  isKnownEmailTemplateKey,
  listEmailTemplateDefinitions,
} from "@/lib/email/templates/templateRegistry";

describe("emailTemplateRegistry", () => {
  it("includes the canonical client-facing templates", () => {
    const keys = listEmailTemplateDefinitions().map((d) => d.key);
    for (const key of [
      "messaging.teacher_new",
      "messaging.staff_portal_new",
      "messaging.reply",
      "billing.enrollment_exemption",
      "billing.promotion_applied",
      "academics.transfer_approved",
      "academics.grade_published_parent",
      "academics.retention_contact",
      "churn.inactivity",
      "notifications.class_reminder_prep",
      "notifications.ward_email_changed",
    ]) {
      expect(keys).toContain(key);
    }
  });

  it("returns a definition with es/en defaults for every registered key", () => {
    for (const def of listEmailTemplateDefinitions()) {
      expect(def.defaults.es.subject).toBeTruthy();
      expect(def.defaults.es.bodyHtml).toBeTruthy();
      expect(def.defaults.en.subject).toBeTruthy();
      expect(def.defaults.en.bodyHtml).toBeTruthy();
      expect(EMAIL_TEMPLATE_CATEGORIES).toContain(def.category);
    }
  });

  it("getEmailTemplateDefinition resolves known keys and rejects unknown ones", () => {
    const def = getEmailTemplateDefinition("messaging.teacher_new");
    expect(def?.key).toBe("messaging.teacher_new");
    expect(getEmailTemplateDefinition("does.not.exist")).toBeNull();
  });

  it("isKnownEmailTemplateKey is consistent with getEmailTemplateDefinition", () => {
    expect(isKnownEmailTemplateKey("messaging.teacher_new")).toBe(true);
    expect(isKnownEmailTemplateKey("does.not.exist")).toBe(false);
  });

  it("does not duplicate template keys", () => {
    const keys = listEmailTemplateDefinitions().map((d) => d.key);
    const dedup = new Set(keys);
    expect(dedup.size).toBe(keys.length);
  });
});
