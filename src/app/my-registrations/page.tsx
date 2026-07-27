"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatParticipationDateDisplay } from "@/lib/registration-mappers";
import { ROUTES } from "@/lib/routes";
import { useRegistrationStore } from "@/store/useRegistrationStore";
import type { Registration, RegistrationStatus } from "@/types";

const STATUS_VARIANT: Record<
  RegistrationStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
  on_hold: "secondary",
};

function formatStatus(status: RegistrationStatus): string {
  return status === "on_hold" ? "Hold" : status.replace("_", " ");
}

function RegistrationCard({ registration }: { registration: Registration }) {
  const title =
    registration.eventName?.trim()
    || (registration.eventId ? `Event ${registration.eventId}` : "Event registration");

  const dateLines =
    registration.registrationDates && registration.registrationDates.length > 0
      ? registration.registrationDates.map((entry) => ({
          date: formatParticipationDateDisplay(entry.date),
          mode: entry.attendanceMode === "virtual" ? "Virtual" : "Physical",
        }))
      : registration.participationDateLabel
        ? [{ date: registration.participationDateLabel, mode: registration.participationModeLabel }]
        : [];

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={STATUS_VARIANT[registration.status]} className="capitalize">
            {formatStatus(registration.status)}
          </Badge>
        </div>
        <CardDescription>
          Registered{" "}
          {registration.createdAt
            ? new Date(registration.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {dateLines.length > 0 ? (
          <ul className="space-y-1.5">
            {dateLines.map((line, index) => (
              <li
                key={`${line.date}-${line.mode ?? ""}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>{line.date}</span>
                {line.mode ? (
                  <Badge variant="outline" className="font-normal">
                    {line.mode}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No participation dates listed.</p>
        )}
        {registration.registeredSessionsCount != null && (
          <p className="text-muted-foreground">
            Sessions:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {registration.registeredSessionsCount}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MyRegistrationsContent() {
  const router = useRouter();
  const {
    registrations,
    isLoading,
    error,
    fetchRegistrations,
  } = useRegistrationStore();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await fetchRegistrations();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchRegistrations]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Registrations</h1>
          <p className="text-muted-foreground">
            Events you have registered for and their attendance status.
          </p>
        </div>
        <Button asChild>
          <Link href={ROUTES.eventRegister}>Register for event</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading registrations…
        </div>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void fetchRegistrations()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No registrations yet"
          description="You have not registered for an event. Register to see it listed here."
          action={{
            label: "Register for event",
            onClick: () => router.push(ROUTES.eventRegister),
          }}
        />
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => (
            <RegistrationCard key={registration.id} registration={registration} />
          ))}
        </div>
      )}

      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back to Home</Link>
      </Button>
    </div>
  );
}

export default function MyRegistrationsPage() {
  return (
    <RouteGuard loginRedirect={ROUTES.myRegistrations}>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="container mx-auto flex-1 px-4 py-8">
          <MyRegistrationsContent />
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}
