"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2, Smartphone } from "lucide-react";
import { OTPInput } from "@/components/shared/OTPInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { resolvePostAuthDestination } from "@/lib/auth-utils";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/constants";
import { isEventRegistrationClosed } from "@/lib/event-registration-window";
import { markLocationPermissionPromptForDestination } from "@/lib/location-permission";
import { ROUTES, buildAuthUrl } from "@/lib/routes";

const loginSchema = z.object({
  identifier: z.string().min(1, "User ID is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const phoneOtpSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
});

type LoginForm = z.infer<typeof loginSchema>;
type PhoneOtpForm = z.infer<typeof phoneOtpSchema>;
type LoginMethod = "email" | "phone";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const verified = searchParams.get("verified") === "1";
  const prefilledEmail = searchParams.get("email") ?? "";
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const {
    login, requestPhoneOtpLogin, loginWithPhoneOtp, isLoading, error, clearError,
  } = useAuthStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: prefilledEmail, rememberMe: false },
  });
  const {
    register: registerPhone,
    handleSubmit: handlePhoneSubmit,
    getValues: getPhoneValues,
    setValue: setPhoneValue,
    formState: { errors: phoneErrors },
  } = useForm<PhoneOtpForm>({
    resolver: zodResolver(phoneOtpSchema),
    defaultValues: { phone: "" },
  });

  const finishLogin = async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      markLocationPermissionPromptForDestination(ROUTES.home, "login");
      router.replace(ROUTES.home);
      return;
    }

    const destination = await resolvePostAuthDestination(user.id, user.role, redirectTo);
    markLocationPermissionPromptForDestination(destination, "login");
    router.replace(destination);
  };

  const onSubmit = async (data: LoginForm) => {
    clearError();
    setLocalError(null);
    setPhoneMessage(null);
    try {
      await login({
        ...data,
        identifier: data.identifier.trim().toLowerCase(),
      });
      await finishLogin();
    } catch {
      // handled in store
    }
  };

  const onSendPhoneOtp = async () => {
    clearError();
    setLocalError(null);
    setPhoneMessage(null);

    const phone = getPhoneValues("phone");
    if (!/^\d{10}$/.test(phone)) {
      setLocalError("Enter a valid 10-digit mobile number");
      return;
    }

    try {
      await requestPhoneOtpLogin(phone);
      setPhoneMessage("OTP sent to your mobile number.");
    } catch {
      // handled in store
    }
  };

  const onVerifyPhoneOtp = async () => {
    clearError();
    setLocalError(null);
    setPhoneMessage(null);

    const phone = getPhoneValues("phone");
    if (!/^\d{10}$/.test(phone)) {
      setLocalError("Enter a valid 10-digit mobile number");
      return;
    }

    if (phoneOtp.length !== 6) {
      setLocalError("Please enter the 6-digit OTP");
      return;
    }

    try {
      await loginWithPhoneOtp(phone, phoneOtp);
      await finishLogin();
    } catch {
      // handled in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
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
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        <Tabs
          value={method}
          onValueChange={(value) => {
            setMethod(value as LoginMethod);
            clearError();
            setLocalError(null);
            setPhoneMessage(null);
          }}
          className="w-full"
        >
          <CardContent className="space-y-4">
            {verified && (
              <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                Account verified successfully. Sign in to continue.
              </div>
            )}
            {redirectTo === ROUTES.streaming && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Please sign in to watch the live stream.
              </div>
            )}
            {redirectTo?.startsWith(ROUTES.eventRegister) && !verified && !isEventRegistrationClosed() && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Sign in to complete your event registration.
              </div>
            )}
            {isEventRegistrationClosed() && !verified && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Event registration is closed. After sign in you will return to the home page to watch recordings.
              </div>
            )}

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone">Phone OTP</TabsTrigger>
              <TabsTrigger value="email">UserId/Password</TabsTrigger>
            </TabsList>

            {(error || localError) && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {localError ?? error}
              </div>
            )}
            {phoneMessage && (
              <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                {phoneMessage}
              </div>
            )}

            <TabsContent value="phone" className="mt-0">
              <form onSubmit={handlePhoneSubmit(onVerifyPhoneOtp)} className="space-y-4">
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">International users:</span> Phone OTP is not
                  supported outside India. Please use{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary underline underline-offset-2 hover:opacity-90"
                    onClick={() => setMethod("email")}
                  >
                    UserId/Password
                  </button>{" "}
                  instead.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-login">Mobile Number</Label>
                  <div className="flex items-center rounded-md border border-input bg-transparent shadow-sm focus-within:ring-2 focus-within:ring-ring">
                    <span className="border-r border-input px-3 text-sm text-muted-foreground">+91</span>
                    <Input
                      id="phone-login"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      className="border-0 shadow-none focus-visible:ring-0"
                      {...registerPhone("phone")}
                      onChange={(event) => {
                        const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhoneValue("phone", nextValue, { shouldValidate: true });
                      }}
                    />
                  </div>
                  {phoneErrors.phone && <p className="text-xs text-destructive">{phoneErrors.phone.message}</p>}
                </div>

                <div>
                  <Button type="button" size="sm" variant="outline" onClick={onSendPhoneOtp} disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Verify"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="inline-flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    OTP Code
                  </Label>
                  <OTPInput value={phoneOtp} onChange={setPhoneOtp} disabled={isLoading} />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || phoneOtp.length !== 6}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">User ID</Label>
                  <Input id="identifier" type="email" placeholder="you@example.com" {...register("identifier")} />
                  {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" placeholder="••••••••" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
                    />
                    <Label htmlFor="rememberMe" className="text-sm font-normal">Remember me</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href={buildAuthUrl(ROUTES.signup, { redirect: redirectTo })} className="text-primary hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </Tabs>
      </Card>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
