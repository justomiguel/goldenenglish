import { describe, expect, it } from "vitest";
import {
  CLASS_REMINDER_TEMPLATE_KEY,
  isEmailSendEnabled,
  isProductEmailEnabled,
  parseEmailSendsEnabled,
} from "@/lib/email/emailSendsEnabled";

describe("parseEmailSendsEnabled", () => {
  it("returns empty map for missing or non-object values", () => {
    expect(parseEmailSendsEnabled(undefined)).toEqual({});
    expect(parseEmailSendsEnabled(null)).toEqual({});
    expect(parseEmailSendsEnabled(true)).toEqual({});
    expect(parseEmailSendsEnabled("no")).toEqual({});
    expect(parseEmailSendsEnabled([])).toEqual({});
  });

  it("keeps only boolean entries", () => {
    expect(
      parseEmailSendsEnabled({
        "churn.inactivity": false,
        "billing.overdue_balance_reminder": true,
        junk: "yes",
        nested: { x: true },
      }),
    ).toEqual({
      "churn.inactivity": false,
      "billing.overdue_balance_reminder": true,
    });
  });
});

describe("isEmailSendEnabled", () => {
  it("treats a missing key as on", () => {
    expect(isEmailSendEnabled({}, "churn.inactivity")).toBe(true);
  });

  it("honors an explicit false", () => {
    expect(isEmailSendEnabled({ "churn.inactivity": false }, "churn.inactivity")).toBe(false);
  });

  it("honors an explicit true", () => {
    expect(isEmailSendEnabled({ "churn.inactivity": true }, "churn.inactivity")).toBe(true);
  });
});

describe("isProductEmailEnabled", () => {
  it("requires class reminders site flag true for the class-reminder template", () => {
    expect(
      isProductEmailEnabled({
        map: {},
        classRemindersEnabled: false,
        templateKey: CLASS_REMINDER_TEMPLATE_KEY,
      }),
    ).toBe(false);
    expect(
      isProductEmailEnabled({
        map: {},
        classRemindersEnabled: true,
        templateKey: CLASS_REMINDER_TEMPLATE_KEY,
      }),
    ).toBe(true);
  });

  it("turns class reminders off when the map says false even if the site flag is on", () => {
    expect(
      isProductEmailEnabled({
        map: { [CLASS_REMINDER_TEMPLATE_KEY]: false },
        classRemindersEnabled: true,
        templateKey: CLASS_REMINDER_TEMPLATE_KEY,
      }),
    ).toBe(false);
  });

  it("ignores the class-reminder site flag for other templates", () => {
    expect(
      isProductEmailEnabled({
        map: {},
        classRemindersEnabled: false,
        templateKey: "churn.inactivity",
      }),
    ).toBe(true);
    expect(
      isProductEmailEnabled({
        map: { "churn.inactivity": false },
        classRemindersEnabled: true,
        templateKey: "churn.inactivity",
      }),
    ).toBe(false);
  });
});
