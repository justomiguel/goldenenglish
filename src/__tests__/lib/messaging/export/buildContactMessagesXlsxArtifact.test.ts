// REGRESSION CHECK: Contact export xlsx includes the brand name and only the chosen columns.
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildContactMessagesXlsxArtifact } from "@/lib/messaging/export/buildContactMessagesXlsxArtifact";

describe("buildContactMessagesXlsxArtifact", () => {
  it("writes the institute name and the selected headers", async () => {
    const artifact = await buildContactMessagesXlsxArtifact({
      exportedOn: "2026-11-05",
      brand: {
        instituteName: "Instituto Norte",
        legalName: "Norte SpA",
        legalRegistry: "76.000.000-0",
        logoUrl: null,
        primaryColor: "#103A5C",
      },
      meta: {
        documentTitle: "Mensajes del formulario",
        exportedAtLabel: "Exportado",
        rowCountLabel: "Mensajes",
        sheetName: "Mensajes",
        exportedAt: "5 nov 2026, 15:04",
        rowCount: 1,
      },
      headers: ["Fecha", "Correo"],
      rows: [["5 nov 2026, 15:04", "ada@example.com"]],
    });

    expect(artifact.filename).toBe("contact-messages_2026-11-05.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(artifact.base64, "base64"));
    const sheet = workbook.getWorksheet("Mensajes");
    expect(sheet?.getCell("A1").value).toBe("Instituto Norte");
    expect(sheet?.getCell("A8").value).toBe("Fecha");
    expect(sheet?.getCell("B8").value).toBe("Correo");
    expect(sheet?.getCell("A9").value).toBe("5 nov 2026, 15:04");
    expect(sheet?.getCell("C8").value).toBeNull();
  });

  it("uses the default sheet name and a wide column for a long header", async () => {
    const artifact = await buildContactMessagesXlsxArtifact({
      exportedOn: "2026-11-05",
      brand: {
        instituteName: "Instituto Norte",
        legalName: "",
        legalRegistry: "   ",
        logoUrl: null,
        primaryColor: "#103A5C",
      },
      meta: {
        documentTitle: "Mensajes",
        exportedAtLabel: "Exportado",
        rowCountLabel: "Mensajes",
        sheetName: "",
        exportedAt: "5 nov 2026",
        rowCount: 1,
      },
      headers: ["Fecha de envío del mensaje"],
      rows: [["5 nov 2026", "extra"]],
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(artifact.base64, "base64"));
    const sheet = workbook.getWorksheet("Messages");
    expect(sheet?.getCell("A7").value).toBe("Fecha de envío del mensaje");
    expect(sheet?.getColumn(1).width).toBe(36);
    expect(sheet?.getCell("B8").value).toBe("extra");
  });
});
