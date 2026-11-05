import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { ContactMessagesExportPdf } from "@/components/dashboard/ContactMessagesExportPdf";
import type {
  ContactMessageExportArtifact,
  ContactMessageExportBrand,
  ContactMessageExportFileMeta,
} from "@/lib/messaging/export/buildContactMessagesXlsxArtifact";

function toBase64(buf: Buffer): string {
  return Buffer.from(buf).toString("base64");
}

async function renderPdf(input: {
  brand: ContactMessageExportBrand;
  meta: ContactMessageExportFileMeta;
  headers: string[];
  rows: string[][];
}): Promise<Buffer> {
  const pdf = await renderToBuffer(
    <ContactMessagesExportPdf
      brand={input.brand}
      meta={input.meta}
      headers={input.headers}
      rows={input.rows}
    />,
  );
  return Buffer.from(pdf);
}

export async function buildContactMessagesPdfArtifact(input: {
  exportedOn: string;
  brand: ContactMessageExportBrand;
  meta: ContactMessageExportFileMeta;
  headers: string[];
  rows: string[][];
}): Promise<ContactMessageExportArtifact> {
  let bytes: Buffer;
  try {
    bytes = await renderPdf(input);
  } catch (error) {
    if (!input.brand.logoUrl) throw error;
    bytes = await renderPdf({ ...input, brand: { ...input.brand, logoUrl: null } });
  }
  return {
    filename: `contact-messages_${input.exportedOn}.pdf`,
    mimeType: "application/pdf",
    base64: toBase64(bytes),
  };
}
