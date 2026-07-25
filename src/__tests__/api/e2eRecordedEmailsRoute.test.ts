/** @vitest-environment node */
// REGRESSION CHECK: recorded-emails introspection must 404 outside e2e/recording mode.
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  clearRecordedEmails,
  RecordingEmailProvider,
} from "@/lib/email/recordingEmailProvider";

describe("GET|DELETE /api/e2e/recorded-emails", () => {
  const prevTarget = process.env.GE_DEV_TARGET;
  const prevProvider = process.env.EMAIL_PROVIDER;

  beforeEach(() => {
    clearRecordedEmails();
    delete process.env.GE_DEV_TARGET;
    delete process.env.EMAIL_PROVIDER;
  });

  afterEach(() => {
    if (prevTarget === undefined) delete process.env.GE_DEV_TARGET;
    else process.env.GE_DEV_TARGET = prevTarget;
    if (prevProvider === undefined) delete process.env.EMAIL_PROVIDER;
    else process.env.EMAIL_PROVIDER = prevProvider;
  });

  it("returns 404 when not in e2e/recording mode", async () => {
    const { GET } = await import("@/app/api/e2e/recorded-emails/route");
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("lists recorded emails when GE_DEV_TARGET=e2e", async () => {
    process.env.GE_DEV_TARGET = "e2e";
    await new RecordingEmailProvider().sendEmail({
      to: "a@example.test",
      subject: "Hi",
      html: "<p>x</p>",
    });
    const { GET } = await import("@/app/api/e2e/recorded-emails/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toMatch(/private/);
    const body = (await res.json()) as {
      ok: boolean;
      emails: Array<{ to: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.emails).toHaveLength(1);
    expect(body.emails[0]?.to).toBe("a@example.test");
  });

  it("clears the store on DELETE", async () => {
    process.env.GE_DEV_TARGET = "e2e";
    await new RecordingEmailProvider().sendEmail({
      to: "b@example.test",
      subject: "Bye",
      html: "<p>y</p>",
    });
    const { DELETE, GET } = await import("@/app/api/e2e/recorded-emails/route");
    const del = await DELETE();
    expect(del.status).toBe(200);
    const list = await GET();
    const body = (await list.json()) as { emails: unknown[] };
    expect(body.emails).toEqual([]);
  });
});
