"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToExcel,
  exportToPdf,
  humanizeFilename,
  type ExportColumn,
} from "@/lib/export-utils";

interface ExportMenuProps<T> {
  filename: string;
  title?: string;
  columns: ExportColumn<T>[];
  data: T[];
  disabled?: boolean;
  label?: string;
  /** When provided, adds Export all Excel/PDF that loads the full dataset first. */
  fetchAllData?: () => Promise<T[]>;
  allFilename?: string;
  allTitle?: string;
}

export function ExportMenu<T>({
  filename,
  title,
  columns,
  data,
  disabled = false,
  label = "Export",
  fetchAllData,
  allFilename,
  allTitle,
}: ExportMenuProps<T>) {
  const [exportingAll, setExportingAll] = useState(false);
  const isEmpty = data.length === 0;
  const exportTitle = title ?? humanizeFilename(filename);
  const canExportPage = !disabled && !isEmpty && !exportingAll;
  const canExportAll = Boolean(fetchAllData) && !disabled && !exportingAll;

  const runExportAll = async (format: "excel" | "pdf") => {
    if (!fetchAllData) return;
    setExportingAll(true);
    try {
      const allRows = await fetchAllData();
      if (allRows.length === 0) return;
      const name = allFilename ?? `${filename}-all`;
      const heading = allTitle ?? `${exportTitle} (All)`;
      if (format === "excel") {
        exportToExcel(name, columns, allRows);
      } else {
        exportToPdf(name, heading, columns, allRows);
      }
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || exportingAll || (isEmpty && !fetchAllData)}>
          {exportingAll ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exportingAll ? "Exporting…" : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={fetchAllData ? "w-52" : "w-44"}>
        <DropdownMenuItem
          onClick={() => exportToExcel(filename, columns, data)}
          disabled={!canExportPage}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {fetchAllData ? "Export page (Excel)" : "Export Excel"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPdf(filename, exportTitle, columns, data)}
          disabled={!canExportPage}
        >
          <FileText className="mr-2 h-4 w-4" />
          {fetchAllData ? "Export page (PDF)" : "Export PDF"}
        </DropdownMenuItem>
        {fetchAllData && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void runExportAll("excel");
              }}
              disabled={!canExportAll}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export all (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void runExportAll("pdf");
              }}
              disabled={!canExportAll}
            >
              <FileText className="mr-2 h-4 w-4" />
              Export all (PDF)
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
