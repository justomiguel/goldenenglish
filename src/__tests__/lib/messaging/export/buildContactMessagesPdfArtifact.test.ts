// REGRESSION CHECK: A logo fetch failure still produces a branded PDF without the image.
import { describe, expect, it, vi } from "vitest";

const renderToBuffer = vi.hoisted(() => vi.fn());

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer,
  Document: ({ children }: { children?: unknown }) => children,
  Page: ({ children }: { children?: unknown }) => children,
  View: ({ children }: { children?: unknown }) => children,
  Text: ({ children }: { children?: unknown }) => children,
  Image: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
}));

import { buildContactMessagesPdfArtifact } from "@/lib/messaging/export/buildContactMessagesPdfArtifact";

const input = {
  exportedOn: "2026-11-05",
  brand: {
    instituteName: "Instituto Norte",
    legalName: "Norte SpA",
    legalRegistry: "",
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#103A5C",
  },
  meta: {
    documentTitle: "Mensajes del formulario",
    exportedAtLabel: "Exportado",
    rowCountLabel: "Mensajes",
    sheetName: "Mensajes",
    exportedAt: "5 nov 2026",
    rowCount: 1,
  },
  headers: ["Nombre"],
  rows: [["Ada"]],
};

describe("buildContactMessagesPdfArtifact", () => {
  it("retries without the logo when the first render fails", async () => {
    renderToBuffer.mockReset();
    renderToBuffer
      .mockRejectedValueOnce(new Error("logo"))
      .mockResolvedValueOnce(Buffer.from("%PDF-1.3"));

    const artifact = await buildContactMessagesPdfArtifact(input);

    expect(artifact.filename).toBe("contact-messages_2026-11-05.pdf");
    expect(artifact.mimeType).toBe("application/pdf");
    expect(renderToBuffer).toHaveBeenCalledTimes(2);
    const second = renderToBuffer.mock.calls[1]?.[0] as { props: { brand: { logoUrl: string | null } } };
    expect(second.props.brand.logoUrl).toBeNull();
    expect(second.props.brand.instituteName).toBe("Instituto Norte");
  });

  it("returns the first render when the logo loads", async () => {
    renderToBuffer.mockReset();
    renderToBuffer.mockResolvedValue(Buffer.from("%PDF-1.3"));
    const artifact = await buildContactMessagesPdfArtifact(input);
    expect(artifact.base64).toBe(Buffer.from("%PDF-1.3").toString("base64"));
    expect(renderToBuffer).toHaveBeenCalledTimes(1);
  });

  it("rethrows when the render fails and there is no logo", async () => {
    renderToBuffer.mockReset();
    renderToBuffer.mockRejectedValue(new Error("pdf"));
    await expect(
      buildContactMessagesPdfArtifact({ ...input, brand: { ...input.brand, logoUrl: null } }),
    ).rejects.toThrow("pdf");
  });
});
