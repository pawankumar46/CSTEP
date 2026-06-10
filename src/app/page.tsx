"use client";

import Link from "next/link";
import { ChevronDown, MapPin, Monitor, Users } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { HeroSection } from "@/components/layout/HeroSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockFAQs } from "@/mock/events";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { FEATURED_EVENT } from "@/lib/constants";
import { getHomeRegisterHref, getHomeRegisterLabel, ROUTES } from "@/lib/routes";

const MVP_FAQS = mockFAQs.slice(0, 4);

function BottomCTA() {
  const { isRegistered, isAuthenticated } = useEventRegistration();
  const registerHref = getHomeRegisterHref(isAuthenticated, isRegistered);
  const registerLabel = getHomeRegisterLabel(isAuthenticated, isRegistered);

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to Join?</h2>
        <p className="text-primary-foreground/80 max-w-lg mx-auto">
          {isAuthenticated && isRegistered
            ? "You're registered for the event. Watch the live stream when it begins."
            : isAuthenticated
              ? "You're signed in. Complete event registration to confirm your participation."
              : `Create an account, then register for ${FEATURED_EVENT.name} on ${FEATURED_EVENT.dates}.`}
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

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavbar />
      <HeroSection />

      <section id="about" className="py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-3xl font-bold">About the Conference</h2>
            <p className="text-muted-foreground">
              CSTEP brings together professionals for a focused two-day conference with
              in-person and virtual participation, streamlined registration, and live streaming.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Users, title: "Delegate Management", desc: "Register online with travel, food, and accessibility preferences" },
              { icon: Monitor, title: "Live & Hybrid", desc: "Join sessions on-site or watch the live stream from anywhere" },
              { icon: MapPin, title: "21st – 22nd August", desc: "Two days of sessions, networking, and coordinated logistics" },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="pt-6 text-center space-y-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {MVP_FAQS.map((faq) => (
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

      <BottomCTA />
      <LandingFooter />
    </div>
  );
}
