import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  ContactMessageExportBrand,
  ContactMessageExportFileMeta,
} from "@/lib/messaging/export/buildContactMessagesXlsxArtifact";

const NEUTRAL = {
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  surface: "#F3F4F6",
};

const ROWS_PER_PAGE = 12;

function chunk(rows: string[][]): string[][][] {
  if (rows.length === 0) return [[]];
  const pages: string[][][] = [];
  for (let index = 0; index < rows.length; index += ROWS_PER_PAGE) {
    pages.push(rows.slice(index, index + ROWS_PER_PAGE));
  }
  return pages;
}

export function ContactMessagesExportPdf(props: {
  brand: ContactMessageExportBrand;
  meta: ContactMessageExportFileMeta;
  headers: string[];
  rows: string[][];
}) {
  const columnWidth = Math.max(48, Math.floor(760 / Math.max(props.headers.length, 1)));
  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 8, color: NEUTRAL.text, fontFamily: "Helvetica" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: NEUTRAL.border,
      paddingBottom: 8,
      marginBottom: 8,
    },
    brand: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 },
    logo: { width: 40, height: 40, marginRight: 8, objectFit: "contain" },
    name: { fontSize: 8, color: NEUTRAL.muted },
    legal: { fontSize: 11, fontWeight: 700, marginTop: 2 },
    registry: { fontSize: 7, color: NEUTRAL.muted, marginTop: 2 },
    side: { alignItems: "flex-end", maxWidth: 240 },
    title: { fontSize: 12, fontWeight: 700 },
    meta: { fontSize: 7, color: NEUTRAL.muted, marginTop: 2 },
    tableHeader: { flexDirection: "row", backgroundColor: NEUTRAL.surface },
    tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: NEUTRAL.border },
    cell: { width: columnWidth, padding: 3, fontSize: 7 },
    headCell: { width: columnWidth, padding: 3, fontSize: 7, fontWeight: 700, color: NEUTRAL.muted },
  });

  const letterhead = (
    <View style={styles.header}>
      <View style={styles.brand}>
        {props.brand.logoUrl ? (
          /* eslint-disable-next-line jsx-a11y/alt-text */
          <Image src={props.brand.logoUrl} style={styles.logo} />
        ) : null}
        <View>
          <Text style={styles.name}>{props.brand.instituteName}</Text>
          <Text style={styles.legal}>{props.brand.legalName}</Text>
          {props.brand.legalRegistry ? <Text style={styles.registry}>{props.brand.legalRegistry}</Text> : null}
        </View>
      </View>
      <View style={styles.side}>
        <Text style={[styles.title, { color: props.brand.primaryColor }]}>{props.meta.documentTitle}</Text>
        <Text style={styles.meta}>
          {props.meta.exportedAtLabel}: {props.meta.exportedAt}
        </Text>
        <Text style={styles.meta}>
          {props.meta.rowCountLabel}: {props.meta.rowCount}
        </Text>
      </View>
    </View>
  );

  return (
    <Document>
      {chunk(props.rows).map((pageRows, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {letterhead}
          <View style={styles.tableHeader}>
            {props.headers.map((header) => (
              <Text key={header} style={styles.headCell}>
                {header}
              </Text>
            ))}
          </View>
          {pageRows.map((row, rowIndex) => (
            <View key={`${pageIndex}-${rowIndex}`} style={styles.tableRow}>
              {row.map((cell, cellIndex) => (
                <Text key={`${rowIndex}-${cellIndex}`} style={styles.cell}>
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}
