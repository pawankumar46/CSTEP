"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={cn("flex h-full flex-col overflow-hidden rounded-lg shadow-sm", className)}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-1">
          <CardTitle
            title={title}
            className="min-h-[2rem] flex-1 pr-1.5 text-xs font-medium leading-tight text-muted-foreground line-clamp-2"
          >
            {title}
          </CardTitle>
          <div className="shrink-0 rounded-md bg-primary/10 p-1.5">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="mt-auto px-3 pb-3 pt-0">
          <div className="text-xl font-bold tabular-nums leading-none">{value}</div>
          {description && (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn("mt-0.5 text-[11px]", trend.value >= 0 ? "text-emerald-600" : "text-red-600")}>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}% {trend.label}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
