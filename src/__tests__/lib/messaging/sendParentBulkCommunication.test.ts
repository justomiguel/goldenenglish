/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { sendParentBulkCommunication } from "@/lib/messaging/useCases/sendParentBulkCommunication";
import { RecordingEmailProvider, clearRecordedEmails, getRecordedEmails } from "@/lib/email/recordingEmailProvider";

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: vi.fn(() =>
    Promise.resolve({
      name: "Test Institute",
      legalName: "Test Institute LLC",
      logoPath: "/images/logo.png",
      logoAlt: "Logo",
      contactEmail: "hi@test.example",
      contactPhone: "",
      contactAddress: "",
      socialFacebook: "",
      socialInstagram: "",
      socialWhatsapp: "",
      tagline: "",
      taglineEn: "",
      legalRegistry: "",
      faviconPath: "",
    }),
  ),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://app.test.example"),
}));

describe("sendParentBulkCommunication", () => {
  it("inserts one portal row per parent and one wrapped cc email", async () => {
    clearRecordedEmails();
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert })) };
    const provider = new RecordingEmailProvider();
    const result = await sendParentBulkCommunication({
      supabase: supabase as never,
      senderId: "admin-1",
      parents: [
        { id: "p1", firstName: "Ana", lastName: "G", email: "ana@x.test" },
        { id: "p2", firstName: "Luis", lastName: "P", email: null },
      ],
      mode: "cc",
      subject: "Aviso",
      html: "<p>Hola</p>",
      fromAddress: "from@x.test",
      locale: "es",
      emailProvider: provider,
    });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      portalOk: 2,
      emailed: 1,
      skippedSynthetic: 1,
      failed: 0,
      persistFailed: 0,
    });
    const recorded = getRecordedEmails();
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      to: "from@x.test",
      cc: ["ana@x.test"],
      subject: "Aviso",
    });
    expect(recorded[0]?.html).toContain("<p>Hola</p>");
    expect(recorded[0]?.html).toContain("Test Institute");
    expect(recorded[0]?.html).toContain("<!DOCTYPE html>");
  });

  it("personalizes individual mail, skips empty bodies, and counts persist/email failures", async () => {
    clearRecordedEmails();
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "insert_failed" } })
      .mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert })) };
    let sendCount = 0;
    const provider = {
      sendEmail: vi.fn(async () => {
        sendCount += 1;
        return { ok: sendCount % 2 === 1 };
      }),
    };
    const result = await sendParentBulkCommunication({
      supabase: supabase as never,
      senderId: "admin-1",
      parents: [
        { id: "p1", firstName: "Ana", lastName: "G", email: "ana@x.test" },
        { id: "p2", firstName: "Luis", lastName: "P", email: "luis@x.test" },
        { id: "p3", firstName: "Mia", lastName: "Q", email: "mia@x.test" },
      ],
      mode: "individual",
      subject: "Hola {{firstName}}",
      html: "<p>Hola {{firstName}}</p>",
      fromAddress: "from@x.test",
      locale: "es",
      emailProvider: provider as never,
    });
    expect(result.persistFailed).toBeGreaterThan(0);
    expect(result.failed + result.emailed).toBeGreaterThan(0);

    const empty = await sendParentBulkCommunication({
      supabase: supabase as never,
      senderId: "admin-1",
      parents: [{ id: "p4", firstName: "Empty", lastName: "B", email: null }],
      mode: "individual",
      subject: "X",
      html: "<p></p>",
      fromAddress: "from@x.test",
      locale: "es",
      emailProvider: provider as never,
    });
    expect(empty.persistFailed).toBe(1);
    expect(empty.emailed).toBe(0);
  });
});
