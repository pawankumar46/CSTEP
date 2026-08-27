"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PhoneWithCountryCode } from "@/components/auth/PhoneWithCountryCode";
import { SignupLocationFields } from "@/components/auth/SignupLocationFields";
import {
  EMPTY_PUBLIC_SIGNUP,
  publicSignupSchema,
  SIGNUP_ORG_TYPES,
  SIGNUP_GENDERS,
  type PublicSignupFormValues,
} from "@/features/auth/signup.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { isIndiaCountryCode, requiresSignupPhoneOtp } from "@/lib/country-codes";
import { DEFAULT_SIGNUP_COUNTRY } from "@/lib/india-states";
import { resolvePostAuthDestination } from "@/lib/auth-utils";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/constants";
import { isEventRegistrationClosed } from "@/lib/event-registration-window";
import { markLocationPermissionPromptForDestination } from "@/lib/location-permission";
import { ROUTES, buildAuthUrl } from "@/lib/routes";

function RequiredMark() {
  return <span className="text-destructive" aria-hidden>*</span>;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { signUp, login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PublicSignupFormValues>({
    resolver: zodResolver(publicSignupSchema),
    defaultValues: { ...EMPTY_PUBLIC_SIGNUP },
  });

  const countryCode = watch("countryCode");
  const phone = watch("phone");

  const orgType = watch("orgType");

  const onSubmit = async (data: PublicSignupFormValues) => {
    clearError();
    try {
      await signUp({
        salutation: data.salutation,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        countryCode: data.countryCode,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        designation: data.designation,
        orgType: data.orgType,
        orgName: data.orgName,
        motivation: data.motivation,
        city: data.city,
        state: data.state,
        country: data.country,
        password: data.password,
      });

      if (requiresSignupPhoneOtp(data.countryCode)) {
        const params = new URLSearchParams({
          email: data.email.trim().toLowerCase(),
          phone: data.phone.trim(),
        });
        if (redirectTo) params.set("redirect", redirectTo);
        router.push(`${ROUTES.otp}?${params.toString()}`);
        return;
      }

      await login({
        identifier: data.email.trim().toLowerCase(),
        password: data.password,
      });
      const user = useAuthStore.getState().user;
      const destination = user
        ? await resolvePostAuthDestination(user.id, user.role, redirectTo)
        : ROUTES.home;
      markLocationPermissionPromptForDestination(destination, "login");
      router.replace(destination);
    } catch {
      // error handled in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
    >
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            {APP_SHORT_NAME}
          </div>
          <span className="font-semibold text-2xl">{APP_NAME}</span>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Sign up to create your account. After you sign in you can explore the site
            {isEventRegistrationClosed()
              ? " and watch event recordings."
              : " and complete event registration when available."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {redirectTo === ROUTES.streaming && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Create an account to watch the live stream.
              </div>
            )}
            {redirectTo?.startsWith(ROUTES.eventRegister) && !isEventRegistrationClosed() && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Create an account to complete your event registration.
              </div>
            )}
            {isEventRegistrationClosed() && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Event registration is closed. After signup you can watch recordings from the home page.
              </div>
            )}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label>Salutation</Label>
              <Controller
                name="salutation"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select salutation" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Mr", "Mrs", "Ms", "Dr", "Prof"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.salutation && (
                <p className="text-xs text-destructive">{errors.salutation.message}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <RequiredMark />
                </Label>
                <Input id="firstName" required aria-required="true" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input id="middleName" {...register("middleName")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <RequiredMark />
              </Label>
              <Input id="lastName" required aria-required="true" {...register("lastName")} />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone Number <RequiredMark />
                </Label>
                <PhoneWithCountryCode
                  id="phone"
                  countryCode={countryCode}
                  phone={phone}
                  onCountryCodeChange={(code) => {
                    setValue("countryCode", code, { shouldValidate: true, shouldDirty: true });
                    if (isIndiaCountryCode(code)) {
                      setValue("country", DEFAULT_SIGNUP_COUNTRY, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      setValue("state", "", { shouldValidate: true, shouldDirty: true });
                      setValue("country", "", { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                  onPhoneChange={(value) =>
                    setValue("phone", value, { shouldValidate: true, shouldDirty: true })
                  }
                  required
                  phonePlaceholder="9999999999"
                />
                {(errors.phone || errors.countryCode) && (
                  <p className="text-xs text-destructive">
                    {errors.phone?.message ?? errors.countryCode?.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <RequiredMark />
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  aria-required="true"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Gender <RequiredMark />
              </Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNUP_GENDERS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation <RequiredMark />
              </Label>
              <Input
                id="designation"
                placeholder="e.g. Researcher, Student"
                required
                aria-required="true"
                {...register("designation")}
              />
              {errors.designation && (
                <p className="text-xs text-destructive">{errors.designation.message}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organisation type</Label>
                <Controller
                  name="orgType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGNUP_ORG_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.orgType && (
                  <p className="text-xs text-destructive">{errors.orgType.message}</p>
                )}
              </div>
              {orgType === "ORGANISATION" && (
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organisation name</Label>
                  <Input id="orgName" {...register("orgName")} />
                  {errors.orgName && (
                    <p className="text-xs text-destructive">{errors.orgName.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivation">What motivates you to attend this event?</Label>
              <Textarea
                id="motivation"
                rows={3}
                placeholder="Share a brief note about why you want to attend"
                {...register("motivation")}
              />
              {errors.motivation && (
                <p className="text-xs text-destructive">{errors.motivation.message}</p>
              )}
            </div>

            <SignupLocationFields
              countryCode={countryCode}
              register={register}
              control={control}
              errors={errors}
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" {...register("password")} />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                href={buildAuthUrl(ROUTES.login, { redirect: redirectTo })}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
