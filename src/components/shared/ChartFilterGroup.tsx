"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChartFilterOption<T extends string> {
  value: T;
  label: string;
}

interface ChartFilterGroupProps<T extends string> {
  options: ChartFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ChartFilterGroup<T extends string>({
  options,
  value,
  onChange,
  className,
}: ChartFilterGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-x-3 gap-y-1.5", className)}>
      {options.map((option) => {
        const id = `chart-filter-${option.value.replace(/\s+/g, "-").toLowerCase()}`;
        return (
          <div key={option.value} className="flex items-center gap-1.5">
            <Checkbox
              id={id}
              checked={value === option.value}
              onCheckedChange={(checked) => {
                if (checked) onChange(option.value);
              }}
            />
            <Label htmlFor={id} className="cursor-pointer text-xs font-normal text-muted-foreground">
              {option.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
