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

    const doc = new jsPDF({
      orientation: columns.length > 5 ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(14);
    doc.text(title, 14, 15);

    autoTable(doc, {
      head: [columns.map((col) => col.header)],
      body: rows.map((row) => columns.map((col) => toCellString(col.value(row)))),
      startY: 22,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: 14, right: 14 },
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
