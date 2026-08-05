"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Inbox } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  searchExtra?: ReactNode;
  pageSize?: number;
  serverPagination?: {
    page: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
    onPageChange: (page: number) => void;
  };
  /** Server-side search — API fires on submit/clear only (not per keystroke). */
  serverSearch?: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onClear: () => void;
    placeholder?: string;
    appliedValue?: string;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  searchExtra,
  pageSize = 10,
  serverPagination,
  serverSearch,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const useClientSearch = Boolean(searchKey) && !serverSearch;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(serverPagination
      ? { manualPagination: true, pageCount: serverPagination.totalPages }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
    ...(useClientSearch ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    ...(useClientSearch
      ? { onGlobalFilterChange: setGlobalFilter, state: { sorting, globalFilter } }
      : { state: { sorting } }),
  });

  const showSearchRow = useClientSearch || serverSearch || searchExtra;

  return (
    <div className="space-y-4">
      {showSearchRow && (
        <div className="flex flex-wrap items-center gap-2">
          {serverSearch ? (
            <SearchBar
              value={serverSearch.value}
              onChange={serverSearch.onChange}
              onSubmit={serverSearch.onSubmit}
              onClear={serverSearch.onClear}
              placeholder={serverSearch.placeholder ?? searchPlaceholder}
              className="max-w-sm"
            />
          ) : (
            searchKey && (
              <SearchBar
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder={searchPlaceholder}
                className="max-w-sm"
              />
            )
          )}
          {serverSearch?.appliedValue ? (
            <span className="text-xs text-muted-foreground">
              Showing results for &quot;{serverSearch.appliedValue}&quot;
            </span>
          ) : null}
          {searchExtra}
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState
                    icon={Inbox}
                    title="No results found"
                    description="Try adjusting your search or filter criteria."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {serverPagination ? (
        <Pagination
          page={serverPagination.page}
          totalPages={serverPagination.totalPages}
          hasNext={serverPagination.hasNext}
          hasPrevious={serverPagination.hasPrevious}
          onPageChange={serverPagination.onPageChange}
        />
      ) : (
        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          totalPages={table.getPageCount()}
          onPageChange={(p) => table.setPageIndex(p - 1)}
        />
      )}
    </div>
  );
}
