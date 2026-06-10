import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ChartCard({ title, description, children, className, compact }: ChartCardProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className={cn(compact && "px-4 py-3 space-y-0")}>
        <CardTitle className={cn(compact ? "text-sm font-medium" : "text-base")}>{title}</CardTitle>
        {description && (
          <CardDescription className={cn(compact && "text-xs")}>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(compact && "px-4 pb-4 pt-0")}>{children}</CardContent>
    </Card>
  );
}
