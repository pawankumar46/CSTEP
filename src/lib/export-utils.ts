export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

function toCellString(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel<T>(filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  void import("xlsx").then((XLSX) => {
    const sheetData = rows.map((row) =>
      Object.fromEntries(
        columns.map((col) => [col.header, toCellString(col.value(row))]),
      ),
    );
    const worksheet = XLSX.utils.json_to_sheet(sheetData, {
      header: columns.map((col) => col.header),
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    downloadBlob(
      `${filename}.xlsx`,
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
  });
}

export function exportToPdf<T>(
  filename: string,
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
): void {
  void Promise.all([import("jspdf"), import("jspdf-autotable")]).then(([jsPDFModule, autoTableModule]) => {
    const { jsPDF } = jsPDFModule;
    const autoTable = autoTableModule.default;
    const isWide = columns.length > 6;
    const pageLongEdge = isWide
      ? Math.min(1400, Math.max(297, 64 + columns.length * 16))
      : 297;

    const doc = new jsPDF({
      orientation: isWide || columns.length > 4 ? "landscape" : "portrait",
      unit: "mm",
      format: isWide ? [210, pageLongEdge] : "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(12);
    const titleLines = doc.splitTextToSize(title, pageWidth - 28);
    doc.text(titleLines, 14, 12);

    const columnStyles: Record<number, { cellWidth?: number; overflow?: "linebreak" | "ellipsize"; halign?: "left" | "center" | "right" }> = {
      0: { cellWidth: isWide ? 52 : 40, overflow: "linebreak", halign: "left" },
    };
    if (isWide) {
      for (let index = 1; index < columns.length; index += 1) {
        const header = columns[index]?.header ?? "";
        const width = Math.min(28, Math.max(12, header.length * 1.8 + 6));
        columnStyles[index] = { cellWidth: width, halign: "center" };
      }
    }

    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => toCellString(col.value(row)))),
      startY: 12 + titleLines.length * 6,
      styles: {
        fontSize: isWide ? 6.5 : 8,
        cellPadding: isWide ? 1.1 : 2,
        overflow: "linebreak",
        valign: "middle",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontSize: isWide ? 6 : 8,
        overflow: "linebreak",
        valign: "middle",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles,
      tableWidth: isWide ? "wrap" : "auto",
      horizontalPageBreak: isWide,
      horizontalPageBreakRepeat: isWide ? [0, 1] : undefined,
      margin: { left: 10, right: 10, top: 12, bottom: 12 },
    });

    doc.save(`${filename}.pdf`);
  });
}

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "export";
}

export function humanizeFilename(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
