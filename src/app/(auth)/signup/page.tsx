"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { APP_NAME, APP_SHORT_NAME } from "@/lib/constants";
import { ROUTES, buildAuthUrl } from "@/lib/routes";

const signupSchema = z.object({
  salutation: z.string().min(1, "Salutation is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const { register, handleSubmit, control, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salutation: "",
      firstName: "",
      middleName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupForm) => {
    clearError();
    try {
      await signUp({
        salutation: data.salutation,
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        password: data.password,
      });
      const params = new URLSearchParams({
        email: data.email.trim().toLowerCase(),
        phone: data.phone,
      });
      if (redirectTo) params.set("redirect", redirectTo);
      router.push(`${ROUTES.otp}?${params.toString()}`);
    } catch {
      // error handled in store
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg"
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
              Sign up to access event registration and the live stream. This creates your user account — event registration comes after you sign in.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {redirectTo === ROUTES.streaming && (
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  Create an account to watch the live stream.
                </div>
              )}
              {redirectTo?.startsWith(ROUTES.eventRegister) && (
                <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  Create an account to complete your event registration.
                </div>
              )}
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label>Salutation</Label>
                <Controller name="salutation" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select salutation" /></SelectTrigger>
                    <SelectContent>
                      {["Mr", "Mrs", "Ms", "Dr", "Prof"].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.salutation && <p className="text-xs text-destructive">{errors.salutation.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" {...register("middleName")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
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
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    )}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <PasswordInput id="confirmPassword" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
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
                <Link href={buildAuthUrl(ROUTES.login, { redirect: redirectTo })} className="text-primary hover:underline">Sign in</Link>
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
