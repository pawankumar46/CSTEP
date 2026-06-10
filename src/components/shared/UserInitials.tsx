import { cn } from "@/lib/utils";

interface UserInitialsProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserInitials({ name, className, size = "md" }: UserInitialsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizeClasses[size],
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
