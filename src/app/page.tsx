"use client";

import Link from "next/link";
import { ChevronDown, MapPin, Monitor, Users } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { HeroSection } from "@/components/layout/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockFAQs } from "@/mock/events";
import { useHomeEvent } from "@/hooks/useHomeEvent";
import { getHomeRegisterHref, getHomeRegisterLabel, ROUTES } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomCTASkeleton } from "@/components/shared/LoadingSkeleton";
import {
  formatEventDateRange,
  formatEventDurationAdjective,
  formatEventDurationNoun,
  getEventDayCount,
} from "@/lib/event-display";
import { formatParticipationDatesFaqAnswer } from "@/lib/participation-dates";

const MVP_FAQS = mockFAQs.slice(0, 4);

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
    ? formatEventDateRange(upcomingEvent.date, upcomingEvent.endDate)
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
          {!isAuthenticated && (
            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white/15 hover:text-white"
              asChild
            >
              <Link href={`${ROUTES.login}?redirect=${ROUTES.streaming}`}>Sign In</Link>
            </Button>
          )}
          {isAuthenticated && !isRegistered && (
            <Button size="lg" variant="secondary" disabled title="Register for an event first to watch live">
              Watch Live
            </Button>
          )}
          {isAuthenticated && isRegistered && (
            <Button size="lg" variant="secondary" asChild>
              <Link href={ROUTES.streaming}>Watch Live</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { isLoading, hasEvent, upcomingEvent } = useHomeEvent();

  const dayCount = upcomingEvent
    ? getEventDayCount(upcomingEvent.date, upcomingEvent.endDate)
    : 0;
  const dateRange = upcomingEvent
    ? formatEventDateRange(upcomingEvent.date, upcomingEvent.endDate)
    : "";

  const aboutCards = [
    {
      icon: Users,
      title: "Delegate Management",
      desc: "Register online with travel, food, and accessibility preferences",
    },
    {
      icon: Monitor,
      title: "Live & Hybrid",
      desc: "Join sessions on-site or watch the live stream from anywhere",
    },
    {
      icon: MapPin,
      title: dateRange,
      desc: `${formatEventDurationNoun(dayCount)} of sessions, networking, and coordinated logistics`,
    },
  ];

  return (
    <section id="about" className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
          <h2 className="text-3xl font-bold">About the Conference</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
              <Skeleton className="h-4 w-5/6 max-w-xl mx-auto" />
            </div>
          ) : (
            <p className="text-muted-foreground">
              {hasEvent
                ? `CSTEP brings together professionals for a focused ${formatEventDurationAdjective(dayCount)} conference with in-person and virtual participation, streamlined registration, and live streaming.`
                : "CSTEP brings together professionals for focused conferences with in-person and virtual participation, streamlined registration, and live streaming."}
            </p>
          )}
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            aboutCards[0],
            aboutCards[1],
            isLoading
              ? { icon: MapPin, title: "", desc: "", loading: true as const }
              : hasEvent
                ? aboutCards[2]
                : {
                    icon: MapPin,
                    title: "Event Schedule",
                    desc: "Multi-day sessions, networking, and coordinated logistics",
                  },
          ].map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6 text-center space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                {"loading" in item ? (
                  <>
                    <Skeleton className="h-5 w-40 mx-auto" />
                    <Skeleton className="h-4 w-full max-w-[220px] mx-auto" />
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { upcomingEvent, hasEvent } = useHomeEvent();

  const faqs = MVP_FAQS.map((faq) =>
    faq.id === "faq-3" && hasEvent
      ? { ...faq, answer: formatParticipationDatesFaqAnswer(upcomingEvent) }
      : faq,
  );

  return (
    <section id="faq" className="py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <details key={faq.id} className="group rounded-lg border bg-background p-4">
              <summary className="flex cursor-pointer items-center justify-between font-medium">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
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

      <FaqSection />

      <BottomCTA />
      <LandingFooter />
    </div>
  );
}
