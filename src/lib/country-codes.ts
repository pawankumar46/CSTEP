/** Dial codes for signup / lobby phone fields. Values match API `country_code` (e.g. "+91"). */
export const DEFAULT_COUNTRY_CODE = "+91";

export const COUNTRY_DIAL_CODES = [
  { code: "+91", label: "India (+91)", maxDigits: 10 },
  { code: "+1", label: "USA / Canada (+1)", maxDigits: 10 },
  { code: "+44", label: "UK (+44)", maxDigits: 11 },
  { code: "+61", label: "Australia (+61)", maxDigits: 9 },
  { code: "+65", label: "Singapore (+65)", maxDigits: 8 },
  { code: "+971", label: "UAE (+971)", maxDigits: 9 },
  { code: "+966", label: "Saudi Arabia (+966)", maxDigits: 9 },
  { code: "+49", label: "Germany (+49)", maxDigits: 11 },
  { code: "+33", label: "France (+33)", maxDigits: 9 },
  { code: "+81", label: "Japan (+81)", maxDigits: 11 },
  { code: "+86", label: "China (+86)", maxDigits: 11 },
  { code: "+977", label: "Nepal (+977)", maxDigits: 10 },
  { code: "+94", label: "Sri Lanka (+94)", maxDigits: 9 },
  { code: "+880", label: "Bangladesh (+880)", maxDigits: 10 },
] as const;

export type CountryDialCode = (typeof COUNTRY_DIAL_CODES)[number]["code"];

export function getCountryDialMeta(code: string) {
  return COUNTRY_DIAL_CODES.find((item) => item.code === code) ?? COUNTRY_DIAL_CODES[0];
}

export function maxPhoneDigitsForCountry(code: string): number {
  return getCountryDialMeta(code).maxDigits;
}

/** India (+91) requires mobile OTP after public signup; other dial codes skip OTP. */
export function requiresSignupPhoneOtp(countryCode: string): boolean {
  return countryCode === DEFAULT_COUNTRY_CODE;
}

/** India (+91) requires mobile OTP after public signup; other dial codes skip OTP. */
export function requiresSignupMobileOtp(countryCode: string): boolean {
  return countryCode === DEFAULT_COUNTRY_CODE;
}
