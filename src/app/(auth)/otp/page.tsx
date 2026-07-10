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
import { ROUTES, buildAuthUrl, sanitizeRedirect } from "@/lib/routes";

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const redirectTo = sanitizeRedirect(searchParams.get("redirect")) ?? ROUTES.home;

  const { verifyOtp, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail]);

  const handleVerify = async () => {
    clearError();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (otp.length !== 6) {
      setFormError("Please enter the 6-digit OTP");
      return;
    }

    try {
      await verifyOtp({
        method: "email",
        otp,
        email: email.trim().toLowerCase(),
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
          <h2 className="text-2xl font-bold">Email verified!</h2>
          <p className="text-muted-foreground">Redirecting to home...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit OTP sent to your email after registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
              {formError ?? error}
            </div>
          )}

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

          <div className="space-y-2">
            <Label>OTP Code</Label>
            <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isLoading ? "Verifying..." : "Verify Email"}
          </Button>
          <Link href={buildAuthUrl(ROUTES.login, { redirect: searchParams.get("redirect") })} className="text-sm text-primary hover:underline">
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
