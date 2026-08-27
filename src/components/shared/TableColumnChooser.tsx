"use client";

import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ColumnChooserOption {
  id: string;
  label: string;
  locked?: boolean;
}

interface TableColumnChooserProps {
  options: ColumnChooserOption[];
  visibleIds: Set<string>;
  onToggle: (id: string, visible: boolean) => void;
  onReset: () => void;
  disabled?: boolean;
}

export function TableColumnChooser({
  options,
  visibleIds,
  onToggle,
  onReset,
  disabled = false,
}: TableColumnChooserProps) {
  const visibleCount = options.filter((option) => visibleIds.has(option.id)).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Columns3 className="mr-2 h-4 w-4" />
          Columns ({visibleCount}/{options.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={visibleIds.has(option.id)}
            disabled={option.locked}
            onCheckedChange={(checked) => onToggle(option.id, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset}>Reset columns</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
