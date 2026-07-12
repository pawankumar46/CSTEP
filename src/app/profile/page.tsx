"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { EventSupportRequestForm } from "@/components/profile/EventSupportRequestForm";
import {
  eventSupportSchema,
  EMPTY_EVENT_SUPPORT,
  SERVICE_TYPES,
  type EventSupportFormValues,
  type ServiceType,
} from "@/features/profile/event-support.schema";
import {
  requestAccommodationSupport,
  requestMedicalSupport,
  requestTranslationSupport,
  requestTravelSupport,
} from "@/services/registration.service";
import { ROUTES } from "@/lib/routes";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEventId = searchParams.get("event");
  const servicesParam = searchParams.get("services");
  const user = useAuthStore((s) => s.user);

  const allowedServices = useMemo<ServiceType[]>(() => {
    if (!servicesParam) return [];
    return servicesParam
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is ServiceType =>
        (SERVICE_TYPES as readonly string[]).includes(value),
      );
  }, [servicesParam]);

  const showAssistance = Boolean(presetEventId) && allowedServices.length > 0;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventSupportFormValues>({
    resolver: zodResolver(eventSupportSchema),
    defaultValues: {
      ...EMPTY_EVENT_SUPPORT,
      serviceType: allowedServices[0] ?? "travel",
      eventId: presetEventId ?? "",
    },
  });

  const values = watch();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmitRequest = async (data: EventSupportFormValues) => {
    setSaveError(null);
    setIsSubmitting(true);
    try {
      switch (data.serviceType) {
        case "travel":
          await requestTravelSupport(data);
          break;
        case "medical":
          await requestMedicalSupport(data);
          break;
        case "translation":
          await requestTranslationSupport(data);
          break;
        case "accommodation":
          await requestAccommodationSupport(data);
          break;
      }
      router.replace(ROUTES.home);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (showAssistance) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Assistance Request</h1>
          <p className="text-muted-foreground">
            You&apos;re registered! This event offers the assistance below — fill in what you need,
            or skip to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Support Request</CardTitle>
              <CardDescription>
                Request assistance for the event you just registered for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventSupportRequestForm
                control={control}
                values={values}
                errors={errors}
                setValue={setValue}
                presetEventId={presetEventId}
                allowedServices={allowedServices}
                lockEvent
              />
            </CardContent>
          </Card>

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace(ROUTES.home)}
              disabled={isSubmitting}
            >
              Maybe later
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View and manage your account details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input defaultValue={user.firstName} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input defaultValue={user.lastName} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={user.email} type="email" readOnly />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue={user.phone} readOnly />
          </div>
          <div className="flex items-center gap-2">
            <Label>Role</Label>
            <RoleBadge role={user.role} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href={ROUTES.home}>Back to Home</Link>
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RouteGuard allowedRoles={["base_user"]} loginRedirect={ROUTES.profile}>
      <div className="flex min-h-screen flex-col">
        <LandingNavbar />
        <main className="container mx-auto flex-1 px-4 py-8">
          <Suspense fallback={null}>
            <ProfileContent />
          </Suspense>
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}
