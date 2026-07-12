"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BedDouble,
  HeartPulse,
  Languages,
  LifeBuoy,
  Loader2,
  Plane,
} from "lucide-react";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getEventDropdown } from "@/services/event.service";
import { useLobbyStore } from "@/store/useLobbyStore";
import { cn } from "@/lib/utils";
import type { EventDropdownOption } from "@/types";

type AssistanceKey =
  | "travelAssistance"
  | "medicalAssistance"
  | "translationAssistance"
  | "accommodationAssistance";

const ASSISTANCE_CARDS: {
  key: AssistanceKey;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    key: "travelAssistance",
    title: "Manage Travel",
    description: "Review and action travel assistance requests.",
    href: "/dashboard/travel",
    icon: Plane,
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  {
    key: "medicalAssistance",
    title: "Manage Medical",
    description: "Review and action medical assistance requests.",
    href: "/dashboard/medical",
    icon: HeartPulse,
    accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  {
    key: "translationAssistance",
    title: "Manage Translation",
    description: "Review and action translation assistance requests.",
    href: "/dashboard/translation",
    icon: Languages,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    key: "accommodationAssistance",
    title: "Manage Accommodation",
    description: "Review and action accommodation assistance requests.",
    href: "/dashboard/accommodation",
    icon: BedDouble,
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

export default function AssistancePage() {
  return (
    <RouteGuard allowedRoles={["moderator", "event_administrator", "super_administrator"]}>
      <AssistanceContent />
    </RouteGuard>
  );
}

function AssistanceContent() {
  const router = useRouter();
  const selectedEventId = useLobbyStore((s) => s.selectedEventId);
  const setSelectedEventId = useLobbyStore((s) => s.setSelectedEventId);

  const [events, setEvents] = useState<EventDropdownOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const options = await getEventDropdown();
        if (!cancelled) setEvents(options);
      } catch (err) {
        if (!cancelled) {
          setEventsError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const availableCards = useMemo(
    () => (selectedEvent ? ASSISTANCE_CARDS.filter((card) => selectedEvent[card.key]) : []),
    [selectedEvent],
  );

  const handleOpen = (href: string) => {
    if (!selectedEvent) return;
    setSelectedEventId(selectedEvent.id);
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Assistance</h1>
        <p className="text-muted-foreground">
          Select an event to manage the assistance types it offers.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label>Event</Label>
            {eventsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
              </div>
            ) : eventsError ? (
              <p className="text-sm text-destructive">{eventsError}</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events available.</p>
            ) : (
              <Select
                value={selectedEventId ?? ""}
                onValueChange={(id) => setSelectedEventId(id)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Assistance available for{" "}
            <span className="text-foreground">{selectedEvent.name}</span>
          </h2>

          {availableCards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <LifeBuoy className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">No assistance types enabled</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  This event does not offer any assistance. Enable travel, medical, translation, or
                  accommodation assistance while editing the event.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {availableCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleOpen(card.href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleOpen(card.href);
                      }
                    }}
                    className="group cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={cn("rounded-lg p-3", card.accent)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{card.title}</p>
                        <p className="text-sm text-muted-foreground">{card.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedEventId("")}>
              Clear selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
