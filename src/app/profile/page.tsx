"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ROUTES } from "@/lib/routes";

/* Assistance services disabled
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { EventSupportRequestForm } from "@/components/profile/EventSupportRequestForm";
import { useEventSupportStore } from "@/store/useEventSupportStore";
import {
  eventSupportSchema,
  EMPTY_EVENT_SUPPORT,
  type EventSupportFormValues,
} from "@/features/profile/event-support.schema";
import { PROFILE_SUPPORT_EVENT_KEY } from "@/lib/routes";
import { useHomeDataStore } from "@/store/useHomeDataStore";
import {
  requestAccommodationSupport,
  requestMedicalSupport,
  requestTranslationSupport,
  requestTravelSupport,
} from "@/services/registration.service";

function getHomeAuthKey(isAuthenticated: boolean, userId?: string): string {
  return `${isAuthenticated}:${userId ?? ""}`;
}
*/

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetEventId = searchParams.get("event");
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (presetEventId) {
      router.replace(ROUTES.profile);
    }
  }, [presetEventId, router]);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">View and manage your account details</p>
      </div>

      {/* Assistance services disabled — travel, medical, translation, accommodation
      {fromRegistration && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          You&apos;re registered for the event. Submit a travel, medical, translation, or accommodation
          support request below if you need assistance.
        </div>
      )}
      <form key={formKey} onSubmit={handleSubmit(onSubmitRequest)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Support Request</CardTitle>
            <CardDescription>
              Request travel, medical, translation, or accommodation assistance for an upcoming event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventSupportRequestForm
              control={control}
              values={values}
              errors={errors}
              setValue={setValue}
              presetEventId={presetEventId}
            />
          </CardContent>
        </Card>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
      */}

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
