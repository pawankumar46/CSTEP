"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OTPInput } from "@/components/shared/OTPInput";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { ROUTES } from "@/lib/routes";
import type { OtpVerifyMethod } from "@/types";

function OTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const prefilledPhone = searchParams.get("phone") ?? "";

  const { verifyOtp, isLoading, error, clearError } = useAuthStore();
  const [method, setMethod] = useState<OtpVerifyMethod>(prefilledPhone ? "phone" : "email");
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(prefilledPhone);
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleVerify = async () => {
    clearError();
    setFormError(null);

    if (method === "phone" && phone.replace(/\D/g, "").length !== 10) {
      setFormError("Phone number must be exactly 10 digits");
      return;
    }
    if (method === "email" && !email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (otp.length !== 6) {
      setFormError("Please enter the 6-digit OTP");
      return;
    }

    try {
      await verifyOtp({
        method,
        otp,
        phone: method === "phone" ? phone : undefined,
        email: method === "email" ? email : undefined,
      });
      setSuccess(true);
      const params = new URLSearchParams({
        verified: "1",
        email: method === "email" ? email.trim().toLowerCase() : prefilledEmail || email.trim().toLowerCase(),
      });
      setTimeout(() => router.push(`${ROUTES.login}?${params.toString()}`), 1500);
    } catch {
      // error handled in store
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Verification Successful!</h2>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify your account</CardTitle>
          <CardDescription>
            Enter the 6-digit OTP sent to your mobile number or email after registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(error || formError) && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">
              {formError ?? error}
            </div>
          )}

          <div className="space-y-3">
            <Label>Verify using</Label>
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as OtpVerifyMethod)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="phone" id="otp-phone" />
                <Label htmlFor="otp-phone" className="font-normal cursor-pointer">Mobile number</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="email" id="otp-email" />
                <Label htmlFor="otp-email" className="font-normal cursor-pointer">Email</Label>
              </div>
            </RadioGroup>
          </div>

          {method === "phone" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>OTP Code</Label>
            <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" onClick={handleVerify} disabled={otp.length !== 6 || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Verify OTP
          </Button>
          <Link href={ROUTES.login} className="text-sm text-primary hover:underline">Back to sign in</Link>
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
