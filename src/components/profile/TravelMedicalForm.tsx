"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MEDICAL_SUPPORT_TYPES, TRAVEL_TYPES } from "@/lib/registration-options";
import type { ProfilePreferencesFormValues } from "@/features/profile/profile-preferences.schema";

interface PreferenceFieldsProps {
  control: Control<ProfilePreferencesFormValues>;
  values: ProfilePreferencesFormValues;
  errors: FieldErrors<ProfilePreferencesFormValues>;
  setValue: UseFormSetValue<ProfilePreferencesFormValues>;
}

export function TravelPreferenceFields({
  control,
  values,
  errors,
  setValue,
}: PreferenceFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Do you need travel support?</Label>
        <Controller
          name="travelRequired"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={(v) => {
                const required = v === "yes";
                field.onChange(required);
                if (!required) setValue("travelType", undefined);
              }}
              value={field.value ? "yes" : "no"}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="profile-travel-yes" />
                <Label htmlFor="profile-travel-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="profile-travel-no" />
                <Label htmlFor="profile-travel-no">No</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>
      {values.travelRequired && (
        <div className="space-y-2">
          <Label>Travel Type</Label>
          <Controller
            name="travelType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select travel type" />
                </SelectTrigger>
                <SelectContent>
                  {TRAVEL_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.travelType && (
            <p className="text-xs text-destructive">{errors.travelType.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MedicalPreferenceFields({
  control,
  values,
  errors,
  setValue,
}: PreferenceFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Do you need medical support?</Label>
        <Controller
          name="medicalSupportRequired"
          control={control}
          render={({ field }) => (
            <RadioGroup
              onValueChange={(v) => {
                const required = v === "yes";
                field.onChange(required);
                if (!required) setValue("medicalSupportType", undefined);
              }}
              value={field.value ? "yes" : "no"}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="profile-med-yes" />
                <Label htmlFor="profile-med-yes">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="profile-med-no" />
                <Label htmlFor="profile-med-no">No</Label>
              </div>
            </RadioGroup>
          )}
        />
      </div>
      {values.medicalSupportRequired && (
        <div className="space-y-2">
          <Label>Support Type</Label>
          <Controller
            name="medicalSupportType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select support type" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_SUPPORT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.medicalSupportType && (
            <p className="text-xs text-destructive">{errors.medicalSupportType.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
