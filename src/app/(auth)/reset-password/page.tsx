"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPInput } from "@/components/shared/OTPInput";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/reset-password.schema";
import { useAuthStore } from "@/store/useAuthStore";
import { ROUTES } from "@/lib/routes";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledPhone = (searchParams.get("phone") ?? "").replace(/\D/g, "").slice(0, 10);

  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState(false);
  const [otp, setOtp] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      phone: prefilledPhone,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (prefilledPhone) {
      setValue("phone", prefilledPhone);
    }
  }, [prefilledPhone, setValue]);

  useEffect(() => {
    setValue("otp", otp, { shouldValidate: otp.length === 6 });
  }, [otp, setValue]);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    clearError();
    try {
      await resetPassword({
        phone: data.phone,
        otp: data.otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push(ROUTES.login), 1500);
    } catch {
      // error in store
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 max-w-md">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Password reset successful</h2>
          <p className="text-muted-foreground">You can now sign in with your new password.</p>
          <Button asChild>
            <Link href={ROUTES.login}>Back to login</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter the OTP sent to your mobile number and choose a new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9999999999"
                    readOnly={Boolean(prefilledPhone)}
                    value={field.value}
                    onChange={(e) =>
                      field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>OTP Code</Label>
              <OTPInput value={otp} onChange={setOtp} disabled={isLoading} />
              {errors.otp && <p className="text-xs text-destructive">{errors.otp.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput id="newPassword" placeholder="Enter new password" {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput id="confirmPassword" placeholder="Confirm new password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
            <Link href={ROUTES.login} className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background p-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
