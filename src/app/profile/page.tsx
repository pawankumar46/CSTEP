"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { RouteGuard } from "@/components/layout/RouteGuard";
import {
  MedicalPreferenceFields,
  TravelPreferenceFields,
} from "@/components/profile/TravelMedicalForm";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfilePreferencesStore } from "@/store/useProfilePreferencesStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  profilePreferencesSchema,
  type ProfilePreferencesFormValues,
} from "@/features/profile/profile-preferences.schema";
import { ROUTES } from "@/lib/routes";
import {
  getUserRegistration,
  updateRegistrationPreferences,
} from "@/services/registration.service";
import type { Registration } from "@/types";

const EMPTY_PREFERENCES: ProfilePreferencesFormValues = {
  travelRequired: false,
  medicalSupportRequired: false,
};

function toFormValues(registration: Registration): ProfilePreferencesFormValues {
  return {
    travelRequired: registration.travelRequired,
    travelType: registration.travelType,
    medicalSupportRequired: registration.medicalSupportRequired,
    medicalSupportType: registration.medicalSupportType,
  };
}

function ProfileContent() {
  const user = useAuthStore((s) => s.user);
  const getStoredPreferences = useProfilePreferencesStore((s) => s.getForEmail);
  const setStoredPreferences = useProfilePreferencesStore((s) => s.setForEmail);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfilePreferencesFormValues>({
    resolver: zodResolver(profilePreferencesSchema),
    defaultValues: EMPTY_PREFERENCES,
  });

  const values = watch();

  useEffect(() => {
    if (!user?.email) return;

    const stored = getStoredPreferences(user.email);
    if (stored) {
      reset(stored);
    }

    let cancelled = false;

    getUserRegistration(user.email)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setRegistrationId(result.id);
          reset(toFormValues(result));
        }
      })
      .catch(() => {
        // Keep locally stored or default values when registration is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email, getStoredPreferences, reset]);

  const onSavePreferences = async (data: ProfilePreferencesFormValues) => {
    if (!user?.email) return;

    setSaveError(null);
    setSaveSuccess(false);

    const payload: ProfilePreferencesFormValues = {
      travelRequired: data.travelRequired,
      travelType: data.travelRequired ? data.travelType : undefined,
      medicalSupportRequired: data.medicalSupportRequired,
      medicalSupportType: data.medicalSupportRequired ? data.medicalSupportType : undefined,
    };

    setStoredPreferences(user.email, payload);

    try {
      if (registrationId) {
        await updateRegistrationPreferences(registrationId, payload);
      }
      reset(payload);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to sync preferences with the server",
      );
    }
  };

  if (!user) return null;

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

      {/* <form onSubmit={handleSubmit(onSavePreferences)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Travel</CardTitle>
            <CardDescription>
              Tell us if you need travel arrangements for the event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TravelPreferenceFields
              control={control}
              values={values}
              errors={errors}
              setValue={setValue}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical</CardTitle>
            <CardDescription>
              Tell us if you need medical or accessibility support at the event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MedicalPreferenceFields
              control={control}
              values={values}
              errors={errors}
              setValue={setValue}
            />
          </CardContent>
        </Card>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        {saveSuccess && (
          <p className="text-sm text-emerald-600">Your preferences have been saved.</p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving..." : "Save Preferences"}
        </Button>
      </form> */}

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
          <ProfileContent />
        </main>
        <LandingFooter />
      </div>
    </RouteGuard>
  );
}
