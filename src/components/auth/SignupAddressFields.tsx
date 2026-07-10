"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignupAddressFormValues } from "@/features/auth/signup.schema";

type AddressFormShape = {
  address: SignupAddressFormValues;
};

interface SignupAddressFieldsProps<T extends AddressFormShape> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  idPrefix?: string;
}

function RequiredMark() {
  return <span className="text-destructive" aria-hidden>*</span>;
}

export function SignupAddressFields<T extends AddressFormShape>({
  register,
  errors,
  idPrefix = "",
}: SignupAddressFieldsProps<T>) {
  const prefix = idPrefix ? `${idPrefix}-` : "";
  const addressErrors = errors.address as FieldErrors<SignupAddressFormValues> | undefined;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Address</p>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}address-line-1`}>
          Address line 1 <RequiredMark />
        </Label>
        <Input
          id={`${prefix}address-line-1`}
          placeholder="Street address"
          {...register("address.addressLine1" as never)}
        />
        {addressErrors?.addressLine1 && (
          <p className="text-xs text-destructive">{addressErrors.addressLine1.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}address-line-2`}>Address line 2 (optional)</Label>
        <Input
          id={`${prefix}address-line-2`}
          placeholder="Apartment, suite, etc."
          {...register("address.addressLine2" as never)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}city`}>
            City <RequiredMark />
          </Label>
          <Input id={`${prefix}city`} {...register("address.city" as never)} />
          {addressErrors?.city && (
            <p className="text-xs text-destructive">{addressErrors.city.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}district`}>
            District <RequiredMark />
          </Label>
          <Input id={`${prefix}district`} {...register("address.district" as never)} />
          {addressErrors?.district && (
            <p className="text-xs text-destructive">{addressErrors.district.message}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}state`}>
            State <RequiredMark />
          </Label>
          <Input id={`${prefix}state`} {...register("address.state" as never)} />
          {addressErrors?.state && (
            <p className="text-xs text-destructive">{addressErrors.state.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}country`}>
            Country <RequiredMark />
          </Label>
          <Input id={`${prefix}country`} {...register("address.country" as never)} />
          {addressErrors?.country && (
            <p className="text-xs text-destructive">{addressErrors.country.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <Label htmlFor={`${prefix}postal-code`}>
          Postal code <RequiredMark />
        </Label>
        <Input id={`${prefix}postal-code`} {...register("address.postalCode" as never)} />
        {addressErrors?.postalCode && (
          <p className="text-xs text-destructive">{addressErrors.postalCode.message}</p>
        )}
      </div>
    </div>
  );
}
