"use client";

import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";

export function AnalyticsUnderDevelopment() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={Construction}
          title="Under development"
          description="Analytics is under development and will be available shortly."
        />
      </CardContent>
    </Card>
  );
}
