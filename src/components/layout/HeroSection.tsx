"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants";
import { getConferenceVenue, ICAS_CONFERENCE, isIcasEventName } from "@/lib/icas-conference";
import { formatEventDateRange, getUpcomingEventDays, getUpcomingEventMonthLabel } from "@/lib/event-display";
import { useHomeEvent } from "@/hooks/useHomeEvent";
import { getHomeRegisterHref, getHomeRegisterLabel, ROUTES } from "@/lib/routes";
import { HeroSectionSkeleton } from "@/components/shared/LoadingSkeleton";
import { WatchLiveButton } from "@/components/shared/WatchLiveButton";
import { cn } from "@/lib/utils";
import type { UpcomingEvent } from "@/types";

const CONFERENCE_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80";

function UpcomingEventHeading({
  eventStart,
  eventEnd,
}: {
  eventStart: string;
  eventEnd?: string;
}) {
  const days = getUpcomingEventDays(eventStart, eventEnd);
  const month = getUpcomingEventMonthLabel(eventStart, eventEnd);

  return (
    <p className="text-sm font-medium uppercase tracking-widest text-primary">
      Upcoming Event ·{" "}
      {days.map((day, index) => (
        <span key={`${day.day}-${index}`}>
          {index > 0 && (index === days.length - 1 ? " and " : ", ")}
          {day.day}
          <sup>{day.suffix}</sup>
        </span>
      ))}{" "}
      {month}
    </p>
  );
}

function HeroEventSlide({
  event,
  isAuthenticated,
}: {
  event: UpcomingEvent;
  isAuthenticated: boolean;
}) {
  const eventIsRegistered = isAuthenticated && event.isRegistered;
  const registerHref = getHomeRegisterHref(isAuthenticated, eventIsRegistered, event.id);
  const registerLabel = isAuthenticated
    ? !event.isRegistered
      ? "Register for Event"
      : null
    : getHomeRegisterLabel(isAuthenticated, eventIsRegistered);

  const dates = formatEventDateRange(event.date, event.endDate);
  const participantsRegistered = event.summary?.totalRegisteredUsers ?? null;
  const venue = getConferenceVenue(event.name, event.location);
  const showTheme = isIcasEventName(event.name);

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      <div className="relative order-2 lg:order-1 h-56 sm:h-72 lg:h-[420px] rounded-2xl overflow-hidden">
        <img
          src={event.imageUrl || CONFERENCE_IMAGE}
          alt={event.name}
          className="absolute inset-0 h-full w-full object-cover opacity-80 dark:opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30 lg:to-background/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </div>

      <div className="order-1 lg:order-2 space-y-5 lg:pl-4 lg:pt-2">
        <UpcomingEventHeading eventStart={event.date} eventEnd={event.endDate} />

        <div className="space-y-4">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <Sparkles className="h-3 w-3" />
            {APP_NAME}
          </Badge>
          {showTheme && (
            <p className="text-sm font-medium text-primary leading-snug max-w-xl">
              {ICAS_CONFERENCE.theme}
            </p>
          )}
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            {event.name}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {event.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {dates}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            {venue}
          </span>
          {participantsRegistered !== null && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              {participantsRegistered.toLocaleString()} registered
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {registerLabel && (
            <Button size="lg" asChild>
              <Link href={registerHref}>
                {registerLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
          <WatchLiveButton
            event={event}
            size="lg"
            variant={registerLabel ? "outline" : "default"}
          />
        </div>

        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            Create an account to register for the event. Already signed up?{" "}
            <Link href={ROUTES.login} className="text-primary hover:underline">Sign in</Link>
          </p>
        )}
        {isAuthenticated && !eventIsRegistered && (
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in. Complete event registration to confirm your participation.
          </p>
        )}
        {isAuthenticated && eventIsRegistered && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            You&apos;re registered for this event. Join the live stream when it begins.
          </p>
        )}
      </div>
    </div>
  );
}

export function HeroSection() {
  const {
    isAuthenticated,
    isLoading,
    hasEvent,
    upcomingEvents,
  } = useHomeEvent();
  const [activeIndex, setActiveIndex] = useState(0);

  const showCarousel = upcomingEvents.length > 1;
  const currentEvent = upcomingEvents[activeIndex];

  useEffect(() => {
    if (activeIndex >= upcomingEvents.length && upcomingEvents.length > 0) {
      setActiveIndex(0);
    }
  }, [activeIndex, upcomingEvents.length]);

  if (isLoading) {
    return <HeroSectionSkeleton />;
  }

  if (!hasEvent || !currentEvent) {
    return (
      <section id="home" className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16">
        <div className="container relative mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">No upcoming events at the moment.</p>
        </div>
      </section>
    );
  }

  const goToPrevious = () => setActiveIndex((index) => Math.max(0, index - 1));
  const goToNext = () => setActiveIndex((index) => Math.min(upcomingEvents.length - 1, index + 1));

  return (
    <section id="home" className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

      <div className="container relative mx-auto px-4">
        <div className={cn("relative", showCarousel && "px-10 sm:px-12 lg:px-14")}>
          {showCarousel && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
                onClick={goToPrevious}
                disabled={activeIndex === 0}
                aria-label="Previous event"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-md"
                onClick={goToNext}
                disabled={activeIndex === upcomingEvents.length - 1}
                aria-label="Next event"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
            >
              <HeroEventSlide
                event={currentEvent}
                isAuthenticated={isAuthenticated}
              />
            </motion.div>
          </AnimatePresence>

          {showCarousel && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {upcomingEvents.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  aria-label={`Go to event ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === activeIndex ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
