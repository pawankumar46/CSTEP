"use client";

import type {
  Control,
  FieldErrors,
  FieldPath,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isIndiaCountryCode } from "@/lib/country-codes";
import { INDIAN_STATES_AND_UTS } from "@/lib/india-states";

type SignupLocationValues = {
  city: string;
  state: string;
  country: string;
  countryCode: string;
};

interface SignupLocationFieldsProps<T extends FieldValues & SignupLocationValues> {
  countryCode: string;
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  idPrefix?: string;
}

function RequiredMark() {
  return <span className="text-destructive" aria-hidden>*</span>;
}

export function SignupLocationFields<T extends FieldValues & SignupLocationValues>({
  countryCode,
  register,
  control,
  errors,
  idPrefix = "",
}: SignupLocationFieldsProps<T>) {
  const isIndia = isIndiaCountryCode(countryCode);
  const cityId = `${idPrefix}city`;
  const stateId = `${idPrefix}state`;
  const countryId = `${idPrefix}country`;
  const cityPath = "city" as FieldPath<T>;
  const countryPath = "country" as FieldPath<T>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={cityId}>
          City <RequiredMark />
        </Label>
        <Input id={cityId} {...register(cityPath)} />
        {errors.city && (
          <p className="text-xs text-destructive">{String(errors.city.message)}</p>
        )}
      </div>

      {isIndia ? (
        <div className="space-y-2">
          <Label htmlFor={stateId}>
            State / UT <RequiredMark />
          </Label>
          <Controller
            name={"state" as Path<T>}
            control={control}
            render={({ field }) => (
              <Select
                value={(field.value as string) || undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger id={stateId}>
                  <SelectValue placeholder="Select state or UT" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {INDIAN_STATES_AND_UTS.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.state && (
            <p className="text-xs text-destructive">{String(errors.state.message)}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={countryId}>
            Country <RequiredMark />
          </Label>
          <Input
            id={countryId}
            placeholder="Enter country"
            {...register(countryPath)}
          />
          {errors.country && (
            <p className="text-xs text-destructive">{String(errors.country.message)}</p>
          )}
        </div>
      )}
    </div>
  );
}
