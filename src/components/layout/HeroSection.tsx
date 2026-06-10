"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin, Play, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_NAME, FEATURED_EVENT } from "@/lib/constants";
import { useEventRegistration } from "@/hooks/useEventRegistration";
import { getHomeRegisterHref, getHomeRegisterLabel, ROUTES } from "@/lib/routes";
import { mockEvents } from "@/mock/events";

const CONFERENCE_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80";

const STREAM_LOGIN_URL = "/login?redirect=/streaming";

export function HeroSection() {
  const { isRegistered, isAuthenticated } = useEventRegistration();
  const registerHref = getHomeRegisterHref(isAuthenticated, isRegistered);
  const registerLabel = getHomeRegisterLabel(isAuthenticated, isRegistered);
  const featuredEvent = mockEvents[0];

  return (
    <section id="home" className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />

      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1 h-56 sm:h-72 lg:h-[420px] rounded-2xl overflow-hidden"
          >
            <img
              src={CONFERENCE_IMAGE}
              alt="Conference"
              className="absolute inset-0 h-full w-full object-cover opacity-80 dark:opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30 lg:to-background/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:order-2 space-y-5 lg:pl-4 lg:pt-2"
          >
            <p className="text-sm font-medium uppercase tracking-widest text-primary">
              Upcoming Event · 21<sup>st</sup> and 22<sup>nd</sup> August
            </p>

            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit gap-1.5">
                <Sparkles className="h-3 w-3" />
                {APP_NAME}
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {FEATURED_EVENT.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Register as a delegate, manage your participation preferences, and join
                the conference in person or via live stream — all from one platform.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                {FEATURED_EVENT.dates}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {FEATURED_EVENT.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                {featuredEvent.registeredCount.toLocaleString()} registered
              </span>
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
              {!isAuthenticated && (
                <Button size="lg" variant="outline" asChild>
                  <Link href={STREAM_LOGIN_URL}>
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    Watch Live
                  </Link>
                </Button>
              )}
              {isAuthenticated && !isRegistered && (
                <Button
                  size="lg"
                  variant={registerLabel ? "outline" : "default"}
                  disabled
                  title="Register for an event first to watch live"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Watch Live
                </Button>
              )}
              {isAuthenticated && isRegistered && (
                <Button size="lg" variant={registerLabel ? "outline" : "default"} asChild>
                  <Link href={ROUTES.streaming}>
                    <Play className="h-4 w-4 mr-2 fill-current" />
                    Watch Live
                  </Link>
                </Button>
              )}
            </div>

            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground">
                Create an account to register for the event. Already signed up?{" "}
                <Link href={ROUTES.login} className="text-primary hover:underline">Sign in</Link>
              </p>
            )}
            {isAuthenticated && !isRegistered && (
              <p className="text-sm text-muted-foreground">
                You&apos;re signed in. Complete event registration to confirm your participation.
              </p>
            )}
            {isAuthenticated && isRegistered && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                You&apos;re registered for the event. Join the live stream when it begins.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
