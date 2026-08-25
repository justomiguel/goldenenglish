import { describe, expect, it } from "vitest";
import { listEmailTemplateDefinitions } from "@/lib/email/templates/templateRegistry";
import {
  buildEmailSendsAdminGroups,
  emailSendRowLabel,
  emailSendUiGroupFor,
} from "@/lib/email/buildEmailSendsAdminGroups";
import { CLASS_REMINDER_TEMPLATE_KEY } from "@/lib/email/emailSendsEnabled";

describe("emailSendUiGroupFor", () => {
  it("puts inactivity and class reminders in automated", () => {
    const defs = listEmailTemplateDefinitions();
    const churn = defs.find((d) => d.key === "churn.inactivity");
    const prep = defs.find((d) => d.key === CLASS_REMINDER_TEMPLATE_KEY);
    expect(churn && emailSendUiGroupFor(churn)).toBe("automated");
    expect(prep && emailSendUiGroupFor(prep)).toBe("automated");
  });
});

describe("buildEmailSendsAdminGroups", () => {
  it("lists every registry key once and marks class reminders from the site flag", () => {
    const defs = listEmailTemplateDefinitions();
    const groups = buildEmailSendsAdminGroups(
      defs,
      { "churn.inactivity": false },
      false,
      "es",
      { inactivity: "No ingreso", classReminder: "Clase" },
    );
    const keys = groups.flatMap((g) => g.rows.map((r) => r.templateKey));
    expect(keys.sort()).toEqual([...defs.map((d) => d.key)].sort());
    expect(groups.map((g) => g.id)).toEqual([
      "automated",
      "billing",
      "academics",
      "messaging",
      "other",
    ]);
    const churn = groups.flatMap((g) => g.rows).find((r) => r.templateKey === "churn.inactivity");
    const prep = groups
      .flatMap((g) => g.rows)
      .find((r) => r.templateKey === CLASS_REMINDER_TEMPLATE_KEY);
    expect(churn?.enabled).toBe(false);
    expect(churn?.label).toBe("No ingreso");
    expect(prep?.enabled).toBe(false);
    expect(prep?.label).toBe("Clase");
  });
});

describe("emailSendRowLabel", () => {
  it("uses dictionary overrides for the two automated rows", () => {
    const defs = listEmailTemplateDefinitions();
    const churn = defs.find((d) => d.key === "churn.inactivity");
    const billing = defs.find((d) => d.key === "billing.overdue_balance_reminder");
    expect(churn).toBeTruthy();
    expect(billing).toBeTruthy();
    const overrides = { inactivity: "No ingreso", classReminder: "Clase" };
    expect(emailSendRowLabel(churn!, "es", overrides)).toBe("No ingreso");
    expect(emailSendRowLabel(billing!, "es", overrides)).toBe(billing!.label.es);
  });
});
