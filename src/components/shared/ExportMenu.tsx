"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
}

export function ExportMenu<T>({
  filename,
  title,
  columns,
  data,
  disabled = false,
  label = "Export",
}: ExportMenuProps<T>) {
  const isEmpty = data.length === 0;
  const exportTitle = title ?? humanizeFilename(filename);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isEmpty}>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => exportToExcel(filename, columns, data)}
          disabled={isEmpty}
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportToPdf(filename, exportTitle, columns, data)}
          disabled={isEmpty}
        >
          <FileText className="h-4 w-4 mr-2" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
