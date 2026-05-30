import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  EventAttendeesExportBrandHeader,
  EventAttendeesExportEventHeader,
  EventAttendeesExportMetaLabels,
  EventAttendeesExportTable,
} from "@/lib/events/export/eventAttendeesExportTypes";

const NEUTRAL = {
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  surfaceMuted: "#F3F4F6",
};

const ROWS_PER_PAGE = 22;

export interface EventAttendeesExportPdfProps {
  brand: EventAttendeesExportBrandHeader;
  event: EventAttendeesExportEventHeader;
  meta: EventAttendeesExportMetaLabels;
  table: EventAttendeesExportTable;
  attendeeCount: number;
  exportedAtFormatted: string;
}

function computeCellWidth(columnCount: number): number {
  const pageWidth = 792;
  const padding = 48;
  return Math.max(36, Math.floor((pageWidth - padding) / Math.max(columnCount, 1)));
}

function chunkRows(rows: string[][]): string[][][] {
  const chunks: string[][][] = [];
  for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
    chunks.push(rows.slice(i, i + ROWS_PER_PAGE));
  }
  return chunks.length > 0 ? chunks : [[]];
}

export function EventAttendeesExportPdf({
  brand,
  event,
  meta,
  table,
  attendeeCount,
  exportedAtFormatted,
}: EventAttendeesExportPdfProps) {
  const cellWidth = computeCellWidth(table.headers.length);
  const rowChunks = chunkRows(table.rows);

  const styles = StyleSheet.create({
    page: {
      padding: 24,
      fontSize: 7,
      color: NEUTRAL.text,
      fontFamily: "Helvetica",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: 10,
      borderBottomColor: NEUTRAL.border,
      borderBottomWidth: 1,
      marginBottom: 10,
    },
    brandBlock: { flexDirection: "row", flex: 1, paddingRight: 12, alignItems: "center" },
    logo: { width: 44, height: 44, marginRight: 8, objectFit: "contain" },
    brandText: { flexDirection: "column", flex: 1 },
    instituteName: { fontSize: 8, color: NEUTRAL.muted, textTransform: "uppercase" },
    legalName: { fontSize: 11, fontWeight: 700, marginTop: 2 },
    legalRegistry: { fontSize: 7, color: NEUTRAL.muted, marginTop: 2 },
    eventBlock: { alignItems: "flex-end", maxWidth: 220 },
    eventCover: { width: 56, height: 56, objectFit: "cover", marginBottom: 4 },
    documentTitle: { fontSize: 12, fontWeight: 700 },
    metaLine: { fontSize: 7, color: NEUTRAL.muted, marginTop: 2 },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: NEUTRAL.surfaceMuted,
      borderBottomColor: NEUTRAL.border,
      borderBottomWidth: 1,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomColor: NEUTRAL.border,
      borderBottomWidth: 0.5,
    },
    headerCell: {
      width: cellWidth,
      padding: 3,
      fontSize: 6,
      fontWeight: 700,
      color: NEUTRAL.muted,
    },
    cell: { width: cellWidth, padding: 3, fontSize: 6 },
    footer: { marginTop: 10, fontSize: 7, color: NEUTRAL.muted },
  });

  const letterhead = (
    <View style={styles.headerRow}>
      <View style={styles.brandBlock}>
        {brand.logoUrl ? (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <Image src={brand.logoUrl} style={styles.logo} />
        ) : null}
        <View style={styles.brandText}>
          <Text style={styles.instituteName}>{brand.instituteName}</Text>
          <Text style={styles.legalName}>{brand.legalName}</Text>
          {brand.legalRegistry ? <Text style={styles.legalRegistry}>{brand.legalRegistry}</Text> : null}
        </View>
      </View>
      <View style={styles.eventBlock}>
        {event.coverImageUrl ? (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <Image src={event.coverImageUrl} style={styles.eventCover} />
        ) : null}
        <Text style={[styles.documentTitle, { color: brand.primaryColor }]}>{meta.documentTitle}</Text>
        <Text style={styles.metaLine}>{event.title}</Text>
        <Text style={styles.metaLine}>
          {meta.eventDate}: {event.eventDateFormatted}
        </Text>
        {event.location ? <Text style={styles.metaLine}>{event.location}</Text> : null}
        <Text style={styles.metaLine}>
          {meta.exportedAt}: {exportedAtFormatted}
        </Text>
        <Text style={styles.metaLine}>
          {meta.attendeeCount}: {attendeeCount}
        </Text>
      </View>
    </View>
  );

  const tableHeader = (
    <View style={styles.tableHeaderRow}>
      {table.headers.map((header) => (
        <Text key={header} style={styles.headerCell}>
          {header}
        </Text>
      ))}
    </View>
  );

  return (
    <Document title={meta.documentTitle}>
      {rowChunks.map((chunk, pageIndex) => (
        <Page key={`page-${pageIndex}`} size="A4" orientation="landscape" style={styles.page}>
          {pageIndex === 0 ? letterhead : null}
          {tableHeader}
          {chunk.map((row, rowIndex) => (
            <View key={`row-${pageIndex}-${rowIndex}`} style={styles.tableRow}>
              {row.map((cell, cellIndex) => (
                <Text key={`cell-${pageIndex}-${rowIndex}-${cellIndex}`} style={styles.cell}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
          {pageIndex === rowChunks.length - 1 &&
          (brand.contactEmail || brand.contactPhone || brand.contactAddress) ? (
            <View style={styles.footer}>
              {[brand.contactAddress, brand.contactEmail, brand.contactPhone]
                .filter((line) => line?.trim())
                .map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
            </View>
          ) : null}
        </Page>
      ))}
    </Document>
  );
}
