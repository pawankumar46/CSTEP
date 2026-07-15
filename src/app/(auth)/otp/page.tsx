"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPInput } from "@/components/shared/OTPInput";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { resendOtp } from "@/services/auth.service";
import { ROUTES, buildAuthUrl, sanitizeRedirect } from "@/lib/routes";

const RESEND_COOLDOWN_SECONDS = 30;

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const prefilledEmail = searchParams.get("email") ?? "";
  const prefilledPhone = searchParams.get("phone") ?? "";
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? ROUTES.home;

  const { verifyOtp, isLoading, error, clearError } = useAuthStore();
  // Email verification disabled — mobile only after signup.
  // const [step, setStep] = useState<VerifyStep>("email");
  // const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(prefilledPhone);
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // useEffect(() => {
  //   if (prefilledEmail) setEmail(prefilledEmail);
  // }, [prefilledEmail]);

  useEffect(() => {
    if (prefilledPhone) setPhone(prefilledPhone);
  }, [prefilledPhone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    clearError();
    setFormError(null);
    setResendMessage(null);

    const contact = phone.trim();
    if (!contact) {
      setFormError("Phone number is required");
      return;
    }

    setResending(true);
    try {
      await resendOtp("phone", contact);
      setOtp("");
      setResendMessage("A new OTP has been sent to your mobile number.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    clearError();
    setFormError(null);
    setResendMessage(null);

    if (!phone.trim()) {
      setFormError("Phone number is required");
      return;
    }
    if (otp.length !== 6) {
      setFormError("Please enter the 6-digit OTP");
      return;
    }

    try {
      // Email verification disabled — skip straight to mobile OTP only.
      // if (isEmailStep) {
      //   await verifyOtp({
      //     method: "email",
      //     otp,
      //     email: email.trim().toLowerCase(),
      //   });
      //   setOtp("");
      //   setResendMessage(null);
      //   setCooldown(0);
      //   setStep("phone");
      //   return;
      // }

      await verifyOtp({
        method: "phone",
        otp,
        phone: phone.trim(),
      });
      setSuccess(true);
      setTimeout(() => router.push(redirectTo), 1500);
    } catch {
      // error handled in store
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Mobile verified!</h2>
          <p className="text-muted-foreground">Redirecting to home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify your mobile number</CardTitle>
          <CardDescription>
            Enter the 6-digit OTP sent to your mobile number after registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
              {formError ?? error}
            </div>
          )}

          {resendMessage && (
            <div className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400 text-center">
              {resendMessage}
            </div>
          )}

          {/* Email verification step — disabled for now
          {isEmailStep ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={Boolean(prefilledEmail)}
              />
            </div>
          ) : (
          */}
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              readOnly={Boolean(prefilledPhone)}
            />
          </div>
          {/* )} */}

          <div className="space-y-2">
            <Label>OTP Code</Label>
            <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isLoading ? "Verifying..." : "Verify Mobile"}
          </Button>

          <p className="text-sm text-muted-foreground">
            Didn&apos;t get the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resending
                ? "Resending..."
                : cooldown > 0
                  ? `Resend OTP in ${cooldown}s`
                  : "Resend OTP to mobile number"}
            </button>
          </p>

          <Link
            href={buildAuthUrl(ROUTES.login, { redirect: searchParams.get("redirect") })}
            className="text-sm text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function OTPPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <OTPForm />
      </Suspense>
    </div>
  );
}
