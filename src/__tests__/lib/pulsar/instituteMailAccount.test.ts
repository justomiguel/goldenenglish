import { describe, expect, it } from "vitest";
import {
  chooseInstituteMailAccount,
  DEFAULT_PULSAR_MAIL_QUOTA,
  parsePulsarMailQuota,
} from "@/lib/pulsar/instituteMailAccount";

describe("parsePulsarMailQuota", () => {
  it("uses 50 when the field is empty", () => {
    expect(parsePulsarMailQuota("")).toBe(DEFAULT_PULSAR_MAIL_QUOTA);
    expect(parsePulsarMailQuota(undefined)).toBe(50);
  });

  it("rejects a value that is not a whole number in range", () => {
    expect(parsePulsarMailQuota("50.5")).toBeNull();
    expect(parsePulsarMailQuota("-1")).toBeNull();
    expect(parsePulsarMailQuota("100001")).toBeNull();
    expect(parsePulsarMailQuota("12")).toBe(12);
    expect(parsePulsarMailQuota(0)).toBe(0);
  });
});

describe("chooseInstituteMailAccount", () => {
  it("uses the institute key and ignores the quota", () => {
    expect(
      chooseInstituteMailAccount({
        tenantKey: "re_school",
        tenantFrom: "School <mail@school.test>",
        pulsarKey: "re_pulsar",
        pulsarFrom: "Pulsar <mail@centrolisto.cl>",
        sent: 50,
        quota: 50,
      }),
    ).toEqual({
      mode: "tenant",
      key: "re_school",
      from: "School <mail@school.test>",
    });
  });

  it("uses the Pulsar account when the institute has no key and still has quota", () => {
    expect(
      chooseInstituteMailAccount({
        tenantKey: null,
        tenantFrom: null,
        pulsarKey: "re_pulsar",
        pulsarFrom: "Pulsar <mail@centrolisto.cl>",
        sent: 49,
        quota: 50,
      }),
    ).toEqual({
      mode: "pulsar",
      key: "re_pulsar",
      from: "Pulsar <mail@centrolisto.cl>",
    });
  });

  it("blocks when the Pulsar quota is used up", () => {
    expect(
      chooseInstituteMailAccount({
        tenantKey: "  ",
        tenantFrom: null,
        pulsarKey: "re_pulsar",
        pulsarFrom: "Pulsar <mail@centrolisto.cl>",
        sent: 50,
        quota: 50,
      }),
    ).toEqual({ mode: "blocked", error: "pulsar_mail_quota" });
  });
});
