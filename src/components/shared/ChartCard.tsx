import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ChartCard({ title, description, filters, children, className, compact }: ChartCardProps) {
  return (
    <Card className={cn("flex h-full flex-col shadow-sm", className)}>
      <CardHeader className={cn(compact && "space-y-2 px-3 py-2")}>
        <CardTitle
          title={title}
          className={cn(
            compact ? "min-h-[1rem] text-xs font-semibold line-clamp-1" : "text-base line-clamp-2",
          )}
        >
          {title}
        </CardTitle>
        {filters}
        {description && (
          <CardDescription className={cn(compact && "text-xs")}>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn("flex-1", compact && "px-3 pb-3 pt-0")}>{children}</CardContent>
    </Card>
  );
}
