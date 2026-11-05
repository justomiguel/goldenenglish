// REGRESSION CHECK: Contact export columns come from the stored HTML and the name/email columns.
import { describe, expect, it } from "vitest";
import { buildPublicSiteContactMessageHtml } from "@/lib/messaging/buildPublicSiteContactMessageHtml";
import {
  buildContactMessageExportTable,
  formatContactMessageExportDay,
  formatContactMessageExportInstant,
  parseContactMessageExportRow,
} from "@/lib/messaging/export/parseContactMessageExportRow";

const html = buildPublicSiteContactMessageHtml({
  subjectFieldLabel: "Asunto",
  subjectLabel: "Precios",
  metaLines: [
    { label: "Nombre", value: "Ada Lovelace" },
    { label: "Correo", value: "ada@example.com" },
    { label: "Teléfono", value: "+54 9 11 5555 0101" },
  ],
  bodyPlain: "Quiero horarios.\n\nGracias.",
});

const source = {
  id: "msg-1",
  createdAt: "2026-11-05T15:04:00.000Z",
  broadcastBatchId: "batch-1",
  displayName: "Ada Lovelace",
  replyEmail: "ada@example.com",
  bodyHtml: html,
};

describe("parseContactMessageExportRow", () => {
  it("reads the six contact-form values", () => {
    const row = parseContactMessageExportRow(source, { locale: "es", timeZone: "UTC" });
    const sentAt = new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(source.createdAt));

    expect(row.sentAt).toBe(sentAt);
    expect(row.name).toBe("Ada Lovelace");
    expect(row.email).toBe("ada@example.com");
    expect(row.phone).toBe("+54 9 11 5555 0101");
    expect(row.subject).toBe("Precios");
    expect(row.body).toBe("Quiero horarios.\n\nGracias.");
  });

  it("prefers the name and email columns and leaves a missing phone empty", () => {
    const row = parseContactMessageExportRow(
      {
        ...source,
        displayName: "Nombre columna",
        replyEmail: "columna@example.com",
        bodyHtml: buildPublicSiteContactMessageHtml({
          subjectFieldLabel: "Asunto",
          subjectLabel: "Clases",
          metaLines: [
            { label: "Nombre", value: "Otro" },
            { label: "Correo", value: "otro@example.com" },
            { label: "Teléfono", value: "" },
          ],
          bodyPlain: "Hola",
        }),
      },
      { locale: "en", timeZone: "UTC" },
    );

    expect(row.name).toBe("Nombre columna");
    expect(row.email).toBe("columna@example.com");
    expect(row.phone).toBe("");
    expect(row.subject).toBe("Clases");
    expect(row.body).toBe("Hola");
  });

  it("reads the name and email from the HTML when the columns are blank", () => {
    const row = parseContactMessageExportRow(
      { ...source, displayName: "  ", replyEmail: null },
      { locale: "es", timeZone: "UTC" },
    );
    expect(row.name).toBe("Ada Lovelace");
    expect(row.email).toBe("ada@example.com");
  });

  it("leaves name, email, subject, and body empty when the HTML has no labels", () => {
    const row = parseContactMessageExportRow(
      {
        ...source,
        displayName: null,
        replyEmail: null,
        bodyHtml: "<p>sin datos</p><p><strong>Asunto</strong> —</p>",
      },
      { locale: "es", timeZone: "UTC" },
    );
    expect(row.name).toBe("");
    expect(row.email).toBe("");
    expect(row.subject).toBe("");
    expect(row.body).toBe("");
  });

  it("uses the text after the rule when the body has no paragraphs", () => {
    const row = parseContactMessageExportRow(
      {
        ...source,
        bodyHtml: "<p>nota</p><p><strong>Asunto</strong> Cupos</p><hr /><div>Texto suelto</div>",
      },
      { locale: "es", timeZone: "UTC" },
    );
    expect(row.subject).toBe("Cupos");
    expect(row.body).toBe("Texto suelto");
  });

  it("returns an empty sent date for a bad instant and UTC for a bad time zone", () => {
    expect(formatContactMessageExportInstant("not-a-date", "es", "UTC")).toBe("");
    const utc = new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date("2026-11-05T15:04:00.000Z"));
    expect(formatContactMessageExportInstant("2026-11-05T15:04:00.000Z", "es", "Not/AZone")).toBe(utc);
    expect(formatContactMessageExportDay("Not/AZone", new Date("2026-11-05T15:04:00.000Z"))).toBe("2026-11-05");
  });

  it("treats a missing HTML body as empty", () => {
    const row = parseContactMessageExportRow(
      { ...source, bodyHtml: null as never },
      { locale: "es", timeZone: "UTC" },
    );
    expect(row.phone).toBe("");
    expect(row.subject).toBe("");
    expect(row.body).toBe("");
  });
});

describe("buildContactMessageExportTable", () => {
  it("keeps the fixed column order for a subset of fields", () => {
    const row = parseContactMessageExportRow(source, { locale: "es", timeZone: "UTC" });
    const table = buildContactMessageExportTable({
      rows: [row],
      fields: ["body", "sentAt", "email"],
      labels: {
        sentAt: "Fecha",
        name: "Nombre",
        email: "Correo",
        phone: "Teléfono",
        subject: "Asunto",
        body: "Mensaje",
      },
    });

    expect(table.headers).toEqual(["Fecha", "Correo", "Mensaje"]);
    expect(table.rows).toEqual([[row.sentAt, row.email, row.body]]);
  });
});
