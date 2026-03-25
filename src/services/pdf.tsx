import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND_BLUE = "#2563eb";
const SLATE_900 = "#0f172a";
const SLATE_700 = "#334155";
const SLATE_400 = "#94a3b8";
const SLATE_200 = "#e2e8f0";
const SLATE_50 = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: SLATE_700,
  },
  header: {
    marginBottom: 20,
    borderBottom: `2px solid ${BRAND_BLUE}`,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    color: BRAND_BLUE,
    fontFamily: "Helvetica-Bold",
  },
  brandTag: {
    fontSize: 8,
    color: SLATE_400,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginBottom: 12,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  metaItem: {
    width: "50%",
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 8,
    color: SLATE_400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
    marginTop: 18,
    marginBottom: 8,
    borderBottom: `1px solid ${SLATE_200}`,
    paddingBottom: 4,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 6,
    color: SLATE_700,
  },
  boldText: {
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: BRAND_BLUE,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: SLATE_700,
  },
  tableContainer: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: SLATE_200,
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: SLATE_50,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: SLATE_200,
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    color: SLATE_700,
  },
  tableHeaderCell: {
    flex: 1,
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: SLATE_900,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  photoContainer: {
    width: "48%",
    marginBottom: 8,
  },
  photo: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 4,
    border: `1px solid ${SLATE_200}`,
  },
  photoLabel: {
    fontSize: 8,
    color: SLATE_400,
    textAlign: "center",
    marginTop: 3,
    textTransform: "capitalize",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1px solid ${SLATE_200}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: SLATE_400,
  },
});

interface PhotoItem {
  url: string;
  type: string;
}

interface ReportProps {
  reportText: string;
  address: string;
  photos: PhotoItem[];
  watermarkText?: string | null;
}

function parseMarkdownToSections(text: string) {
  const sections: { title: string; content: string[] }[] = [];
  let currentSection = { title: "", content: [] as string[] };

  const lines = text.split("\n");

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(?:\d+\.\s+)?\*{0,2}(.+?)\*{0,2}$/);
    if (headerMatch) {
      if (currentSection.title || currentSection.content.length > 0) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        title: headerMatch[1].replace(/\*+/g, "").trim(),
        content: [],
      };
    } else if (line.trim()) {
      currentSection.content.push(line.replace(/\*+/g, "").trim());
    }
  }

  if (currentSection.title || currentSection.content.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  const tableLines = lines.filter(
    (l) => l.includes("|") && !l.match(/^\|[\s-|]+\|$/)
  );
  if (tableLines.length < 2) return null;

  const parse = (line: string) =>
    line
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);

  const headers = parse(tableLines[0]);
  const rows = tableLines.slice(1).map(parse);

  return { headers, rows };
}

export function createReportDocument({
  reportText,
  address,
  photos,
  watermarkText,
}: ReportProps) {
  const sections = parseMarkdownToSections(reportText);
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {watermarkText ? (
          <>
            <View
              fixed
              style={{
                position: "absolute",
                top: 180,
                left: 40,
                right: 40,
                alignItems: "center",
                transform: "rotate(-28deg)",
                opacity: 0.18,
              }}
            >
              <Text
                style={{
                  fontSize: 44,
                  fontFamily: "Helvetica-Bold",
                  color: "#1d4ed8",
                  textAlign: "center",
                }}
              >
                {watermarkText}
              </Text>
            </View>
            <View
              fixed
              style={{
                position: "absolute",
                top: 430,
                left: 40,
                right: 40,
                alignItems: "center",
                transform: "rotate(-28deg)",
                opacity: 0.12,
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontFamily: "Helvetica-Bold",
                  color: "#1d4ed8",
                  textAlign: "center",
                }}
              >
                {watermarkText}
              </Text>
            </View>
          </>
        ) : null}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brandName}>Property Damage</Text>
            <Text style={styles.brandTag}>Inspection Report</Text>
          </View>
          <Text style={styles.reportTitle}>
            Property Damage Inspection Report
          </Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Property Address</Text>
              <Text style={styles.metaValue}>{address}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Inspection Date</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Photos Analyzed</Text>
              <Text style={styles.metaValue}>{photos.length}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Report Generated</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Report sections */}
        {sections.map((section, i) => {
          if (
            section.title === "Property Damage Inspection Report" ||
            section.title === "Property Details"
          ) {
            return null;
          }

          const table = parseTable(section.content);

          return (
            <View key={i} wrap={false}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              {table ? (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    {table.headers.map((h, hi) => (
                      <Text key={hi} style={styles.tableHeaderCell}>
                        {h}
                      </Text>
                    ))}
                  </View>
                  {table.rows.map((row, ri) => (
                    <View
                      key={ri}
                      style={[
                        styles.tableRow,
                        ri === table.rows.length - 1
                          ? { borderBottomWidth: 0 }
                          : {},
                      ]}
                    >
                      {row.map((cell, ci) => (
                        <Text key={ci} style={styles.tableCell}>
                          {cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              ) : (
                section.content
                  .filter((line) => !line.match(/^\|[\s-|]+\|?$/))
                  .map((line, j) => {
                    const isBullet =
                      line.startsWith("- ") || line.startsWith("• ");
                    if (isBullet) {
                      return (
                        <View key={j} style={styles.bulletPoint}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>
                            {line.replace(/^[-•]\s*/, "")}
                          </Text>
                        </View>
                      );
                    }
                    return (
                      <Text key={j} style={styles.paragraph}>
                        {line}
                      </Text>
                    );
                  })
              )}
            </View>
          );
        })}

        {/* Photo evidence */}
        {photos.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>Photographic Evidence</Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, i) => (
                <View key={i} style={styles.photoContainer}>
                  <Image src={photo.url} style={styles.photo} />
                  <Text style={styles.photoLabel}>
                    Photo {i + 1} — {photo.type.replace(/_/g, " ")}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {address}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
