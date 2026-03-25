import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

interface PhotoItem {
  url: string;
  type: string;
}

function parseMarkdownToSections(text: string) {
  const sections: { title: string; content: string[] }[] = [];
  let currentSection = { title: "", content: [] as string[] };
  const lines = text.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const headerMatch = line.match(
      /^#{1,3}\s+(?:\d+\.\s+)?\*{0,2}(.+?)\*{0,2}$/
    );
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
    (l) => l.includes("|") && !l.match(/^\|[\s-|]+\|?$/)
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

function createTable(headers: string[], rows: string[][]) {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true })],
                }),
              ],
              borders: { top: border, bottom: border, left: border, right: border },
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: headers.map(
              (_, idx) =>
                new TableCell({
                  children: [new Paragraph(row[idx] || "")],
                  borders: {
                    top: border,
                    bottom: border,
                    left: border,
                    right: border,
                  },
                })
            ),
          })
      ),
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const { reportText, address, photos = [] } = (await request.json()) as {
      reportText: string;
      address: string;
      photos: PhotoItem[];
    };

    if (!reportText) {
      return NextResponse.json(
        { error: "reportText is required" },
        { status: 400 }
      );
    }

    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const sections = parseMarkdownToSections(reportText);
    const docElements: (Paragraph | Table)[] = [];

    docElements.push(
      new Paragraph({
        text: "Property Damage Inspection Report",
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Address: ", bold: true }),
          new TextRun(address || "N/A"),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Generated: ", bold: true }),
          new TextRun(date),
        ],
      }),
      new Paragraph("")
    );

    for (const section of sections) {
      if (
        section.title === "Property Damage Inspection Report" ||
        section.title === "Property Details"
      ) {
        continue;
      }

      if (section.title) {
        docElements.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
          })
        );
      }

      const table = parseTable(section.content);
      if (table) {
        docElements.push(createTable(table.headers, table.rows), new Paragraph(""));
        continue;
      }

      for (const line of section.content.filter((l) => !l.match(/^\|[\s-|]+\|?$/))) {
        const isBullet = line.startsWith("- ") || line.startsWith("• ");
        if (isBullet) {
          docElements.push(
            new Paragraph({
              text: line.replace(/^[-•]\s*/, ""),
              bullet: { level: 0 },
            })
          );
        } else {
          docElements.push(new Paragraph(line));
        }
      }

      docElements.push(new Paragraph(""));
    }

    if (Array.isArray(photos) && photos.length > 0) {
      docElements.push(
        new Paragraph({
          text: "Photographic Evidence",
          heading: HeadingLevel.HEADING_2,
        })
      );
      photos.forEach((photo, idx) => {
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Photo ${idx + 1} - ${photo.type.replace(/_/g, " ")}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [new TextRun(photo.url)],
            alignment: AlignmentType.LEFT,
          }),
          new Paragraph("")
        );
      });
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docElements,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="Inspection_Report.docx"',
      },
    });
  } catch (error) {
    console.error("DOCX generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX" },
      { status: 500 }
    );
  }
}
