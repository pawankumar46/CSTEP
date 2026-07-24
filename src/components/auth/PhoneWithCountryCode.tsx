"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUNTRY_DIAL_CODES,
  maxPhoneDigitsForCountry,
} from "@/lib/country-codes";
import { cn } from "@/lib/utils";

interface PhoneWithCountryCodeProps {
  id?: string;
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  phonePlaceholder?: string;
}

export function PhoneWithCountryCode({
  id = "phone",
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  disabled,
  required,
  className,
  phonePlaceholder = "Mobile number",
}: PhoneWithCountryCodeProps) {
  const maxDigits = maxPhoneDigitsForCountry(countryCode);

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-md border border-input bg-transparent shadow-sm focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      <Select
        value={countryCode}
        onValueChange={(value) => {
          onCountryCodeChange(value);
          onPhoneChange(phone.slice(0, maxPhoneDigitsForCountry(value)));
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-9 w-[7.5rem] shrink-0 rounded-none border-0 border-r border-input shadow-none focus:ring-0"
          aria-label="Country code"
        >
          <SelectValue placeholder="+91" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_DIAL_CODES.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        maxLength={maxDigits}
        placeholder={phonePlaceholder}
        required={required}
        aria-required={required}
        disabled={disabled}
        className="border-0 shadow-none focus-visible:ring-0"
        value={phone}
        onChange={(event) =>
          onPhoneChange(event.target.value.replace(/\D/g, "").slice(0, maxDigits))
        }
      />
    </div>
  );
}
