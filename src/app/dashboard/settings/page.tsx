"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { RoleBadge } from "@/components/shared/RoleBadge";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { OTPInput } from "@/components/shared/OTPInput";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { forgotPassword, resetPassword } from "@/services/auth.service";
import { LOBBY_USER_SALUTATIONS } from "@/features/dashboard/admin-lobby-user.schema";
import {
  profileDetailsSchema,
  type ProfileDetailsFormValues,
} from "@/features/dashboard/admin-profile.schema";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/reset-password.schema";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const profileForm = useForm<ProfileDetailsFormValues>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      salutation: user?.salutation ?? "",
      firstName: user?.firstName ?? "",
      middleName: user?.middleName ?? "",
      lastName: user?.lastName ?? "",
    },
  });

  const passwordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: user?.email ?? "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      salutation: user.salutation ?? "",
      firstName: user.firstName ?? "",
      middleName: user.middleName ?? "",
      lastName: user.lastName ?? "",
    });
    passwordForm.setValue("email", user.email ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    passwordForm.setValue("otp", otp, { shouldValidate: otp.length === 6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!user) return null;

  const onSaveProfile = async (values: ProfileDetailsFormValues) => {
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await updateProfile({
        salutation: values.salutation || undefined,
        firstName: values.firstName,
        middleName: values.middleName || undefined,
        lastName: values.lastName,
      });
      setProfileSuccess(true);
      profileForm.reset(values);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const resetPasswordForm = () => {
    setOtp("");
    passwordForm.reset({
      email: user.email ?? "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const onSendOtp = async () => {
    setSendingOtp(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await forgotPassword(user.email);
      resetPasswordForm();
      setResetDialogOpen(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const onResetPassword = async (values: ResetPasswordFormValues) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      await resetPassword({
        email: values.email,
        otp: values.otp,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setPasswordSuccess(true);
      setResetDialogOpen(false);
      resetPasswordForm();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to reset password");
    }
  };

  const savingProfile = profileForm.formState.isSubmitting;
  const resetting = passwordForm.formState.isSubmitting;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account details and password</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and view your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="salutation">Title</Label>
                <Controller
                  name="salutation"
                  control={profileForm.control}
                  render={({ field }) => (
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger id="salutation">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOBBY_USER_SALUTATIONS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...profileForm.register("firstName")} />
                {profileForm.formState.errors.firstName && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.firstName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="Optional"
                  {...profileForm.register("middleName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...profileForm.register("lastName")} />
                {profileForm.formState.errors.lastName && (
                  <p className="text-xs text-destructive">
                    {profileForm.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email} type="email" readOnly disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={user.phone} readOnly disabled />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label>Role</Label>
              <RoleBadge role={user.role} />
            </div>

            {profileError && <p className="text-sm text-destructive">{profileError}</p>}
            {profileSuccess && (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Profile updated successfully
              </p>
            )}

            <Button type="submit" disabled={savingProfile || !profileForm.formState.isDirty}>
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Reset your password using an OTP sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} type="email" readOnly disabled />
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a 6-digit verification code to this email.
              </p>
            </div>

            {passwordError && !resetDialogOpen && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Password reset successfully
              </p>
            )}

            <Button type="button" onClick={onSendOtp} disabled={sendingOtp}>
              {sendingOtp ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {sendingOtp ? "Sending..." : "Send OTP"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          if (resetting) return;
          setResetDialogOpen(open);
          if (!open) {
            setPasswordError(null);
            resetPasswordForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">{user.email}</span> and choose a new
              password.
            </DialogDescription>
          </DialogHeader>

          <form
            id="reset-password-form"
            onSubmit={passwordForm.handleSubmit(onResetPassword)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>OTP Code</Label>
              <OTPInput value={otp} onChange={setOtp} disabled={resetting} />
              <p className="text-xs text-muted-foreground">
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={sendingOtp}
                  className="text-primary hover:underline disabled:opacity-50"
                >
                  {sendingOtp ? "Resending..." : "Resend"}
                </button>
              </p>
              {passwordForm.formState.errors.otp && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.otp.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                placeholder="Enter new password"
                {...passwordForm.register("newPassword")}
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm new password"
                {...passwordForm.register("confirmPassword")}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={resetting}
              onClick={() => setResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="reset-password-form"
              disabled={resetting || otp.length !== 6}
            >
              {resetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
