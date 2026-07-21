"use client";

import Link from "next/link";
import { Calendar, GraduationCap, Layers, Mail, MapPin, Monitor, Wind, FileText, BarChart3 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { HeroSection } from "@/components/layout/HeroSection";
import { ConferenceDocumentsSection } from "@/components/layout/ConferenceDocumentsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHomeEvent } from "@/hooks/useHomeEvent";
import { getHomeRegisterHref, getHomeRegisterLabel, ROUTES } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomCTASkeleton } from "@/components/shared/LoadingSkeleton";
import { WatchLiveButton } from "@/components/shared/WatchLiveButton";
import {
  formatHomeEventDateRange,
} from "@/lib/event-display";
import { ICAS_CONFERENCE } from "@/lib/icas-conference";

const HIGHLIGHT_ICONS = [Wind, Layers, FileText, BarChart3, GraduationCap] as const;

function BottomCTA() {
  const {
    isRegistered,
    isAuthenticated,
    isLoading,
    hasEvent,
    upcomingEvent,
  } = useHomeEvent();

  const title = upcomingEvent?.name ?? "";
  const dates = upcomingEvent
    ? formatHomeEventDateRange(upcomingEvent.name, upcomingEvent.date, upcomingEvent.endDate)
    : "";
  const registerHref = upcomingEvent
    ? getHomeRegisterHref(isAuthenticated, isRegistered, upcomingEvent.id)
    : ROUTES.eventRegister;
  const registerLabel = isAuthenticated
    ? upcomingEvent && !isRegistered
      ? "Register for Event"
      : null
    : getHomeRegisterLabel(isAuthenticated, isRegistered);

  if (isLoading) {
    return <BottomCTASkeleton />;
  }

  if (!hasEvent) {
    return null;
  }

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to Join?</h2>
        <p className="text-primary-foreground/80 max-w-lg mx-auto">
          {isAuthenticated && isRegistered
            ? "You're registered for the event. Watch the live stream when it begins."
            : isAuthenticated
              ? "You're signed in. Complete event registration to confirm your participation."
              : `Create an account, then register for ${title} on ${dates}.`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {registerLabel && (
            <Button size="lg" variant="secondary" asChild>
              <Link href={registerHref}>{registerLabel}</Link>
            </Button>
          )}
          <WatchLiveButton
            event={upcomingEvent}
            size="lg"
            variant="secondary"
            className="border-white bg-transparent text-white hover:bg-white/15 hover:text-white disabled:opacity-50"
          />
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { isLoading, hasEvent, upcomingEvent } = useHomeEvent();

  const dateRange = upcomingEvent
    ? formatHomeEventDateRange(upcomingEvent.name, upcomingEvent.date, upcomingEvent.endDate)
    : ICAS_CONFERENCE.datesLabel;

  return (
    <section id="about" className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start max-w-6xl mx-auto mb-10">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">About the Conference</h2>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-primary">{ICAS_CONFERENCE.theme}</p>
                <p className="text-muted-foreground">{ICAS_CONFERENCE.intro}</p>
                {ICAS_CONFERENCE.aboutParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
                <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    {hasEvent ? dateRange : ICAS_CONFERENCE.datesLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    {ICAS_CONFERENCE.venue}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-3xl font-bold">What to Expect</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {ICAS_CONFERENCE.highlights.map((item, index) => {
                  const Icon = HIGHLIGHT_ICONS[index] ?? Monitor;
                  return (
                    <Card key={item.title} className="shadow-sm">
                      <CardContent className="pt-5 pb-5 flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ConferenceDocumentsSection />

        <div id="contact" className="max-w-2xl mx-auto scroll-mt-24">
          <Card className="shadow-sm">
            <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Got any queries? Reach out to</p>
                <p className="text-sm text-muted-foreground">{ICAS_CONFERENCE.contact.name}</p>
                <a
                  href={`mailto:${ICAS_CONFERENCE.contact.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {ICAS_CONFERENCE.contact.email}
                </a>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link href={ICAS_CONFERENCE.sourceUrl} target="_blank" rel="noopener noreferrer">
                  View on CSTEP
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <HeroSection />

      <AboutSection />

      <BottomCTA />
      <LandingFooter />
    </div>
  );
}
