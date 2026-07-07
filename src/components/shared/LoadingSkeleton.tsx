import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StatCardSkeleton() {
  return (
    <Card className="flex h-full flex-col rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-3 pb-1">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="mt-auto px-3 pb-3 pt-0">
        <Skeleton className="h-6 w-12" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function HeroSectionSkeleton() {
  return (
    <section id="home" className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <Skeleton className="order-2 lg:order-1 h-56 sm:h-72 lg:h-[420px] rounded-2xl" />
          <div className="order-1 lg:order-2 space-y-5 lg:pl-4 lg:pt-2">
            <Skeleton className="h-4 w-56" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-12 w-full max-w-lg" />
              <Skeleton className="h-12 w-full max-w-md" />
              <Skeleton className="h-20 w-full max-w-xl" />
            </div>
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Skeleton className="h-11 w-40 rounded-md" />
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function BottomCTASkeleton() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center space-y-6">
        <Skeleton className="h-9 w-48 mx-auto bg-primary-foreground/20" />
        <Skeleton className="h-5 w-full max-w-lg mx-auto bg-primary-foreground/20" />
        <Skeleton className="h-5 w-3/4 max-w-md mx-auto bg-primary-foreground/20" />
        <div className="flex flex-wrap justify-center gap-3">
          <Skeleton className="h-11 w-32 rounded-md bg-primary-foreground/20" />
          <Skeleton className="h-11 w-28 rounded-md bg-primary-foreground/20" />
        </div>
      </div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-64 w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}
