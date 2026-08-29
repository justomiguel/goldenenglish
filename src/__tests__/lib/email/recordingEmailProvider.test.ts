/** @vitest-environment node */
// REGRESSION CHECK: Recording provider must never call Resend; e2e relies on ok:true + in-memory log.
import { describe, it, expect, beforeEach } from "vitest";
import {
  RecordingEmailProvider,
  clearRecordedEmails,
  getRecordedEmails,
} from "@/lib/email/recordingEmailProvider";

describe("RecordingEmailProvider", () => {
  beforeEach(() => {
    clearRecordedEmails();
  });

  it("returns ok:true and records the payload without network", async () => {
    const provider = new RecordingEmailProvider();
    const input = {
      to: "ward@example.test",
      subject: "Hello",
      html: "<p>body</p>",
    };

    const result = await provider.sendEmail(input);

    expect(result).toEqual({ ok: true });
    expect(getRecordedEmails()).toEqual([input]);
  });

  it("records cc and bcc when provided", async () => {
    const provider = new RecordingEmailProvider();
    await provider.sendEmail({
      to: "from@x.test",
      cc: ["a@x.test"],
      bcc: ["b@x.test"],
      subject: "Hi",
      html: "<p>x</p>",
    });
    expect(getRecordedEmails()[0]).toEqual({
      to: "from@x.test",
      cc: ["a@x.test"],
      bcc: ["b@x.test"],
      subject: "Hi",
      html: "<p>x</p>",
    });
  });

  it("appends multiple sends and clearRecordedEmails empties the store", async () => {
    const provider = new RecordingEmailProvider();
    await provider.sendEmail({ to: "a@x.test", subject: "1", html: "<p>1</p>" });
    await provider.sendEmail({ to: "b@x.test", subject: "2", html: "<p>2</p>" });

    expect(getRecordedEmails()).toHaveLength(2);
    clearRecordedEmails();
    expect(getRecordedEmails()).toEqual([]);
  });
});
