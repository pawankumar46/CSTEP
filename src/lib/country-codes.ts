/** Dial codes for signup / lobby phone fields. Values match API `country_code` (e.g. "+91"). */
export const DEFAULT_COUNTRY_CODE = "+91";

/** India first (default), then A–Z. Each `code` must be unique for the select. */
export const COUNTRY_DIAL_CODES = [
  { code: "+91", label: "India (+91)", maxDigits: 10 },
  { code: "+93", label: "Afghanistan (+93)", maxDigits: 9 },
  { code: "+355", label: "Albania (+355)", maxDigits: 9 },
  { code: "+213", label: "Algeria (+213)", maxDigits: 9 },
  { code: "+54", label: "Argentina (+54)", maxDigits: 10 },
  { code: "+374", label: "Armenia (+374)", maxDigits: 8 },
  { code: "+61", label: "Australia (+61)", maxDigits: 9 },
  { code: "+43", label: "Austria (+43)", maxDigits: 11 },
  { code: "+994", label: "Azerbaijan (+994)", maxDigits: 9 },
  { code: "+973", label: "Bahrain (+973)", maxDigits: 8 },
  { code: "+880", label: "Bangladesh (+880)", maxDigits: 10 },
  { code: "+32", label: "Belgium (+32)", maxDigits: 9 },
  { code: "+975", label: "Bhutan (+975)", maxDigits: 8 },
  { code: "+55", label: "Brazil (+55)", maxDigits: 11 },
  { code: "+673", label: "Brunei (+673)", maxDigits: 7 },
  { code: "+359", label: "Bulgaria (+359)", maxDigits: 9 },
  { code: "+855", label: "Cambodia (+855)", maxDigits: 9 },
  { code: "+56", label: "Chile (+56)", maxDigits: 9 },
  { code: "+86", label: "China (+86)", maxDigits: 11 },
  { code: "+57", label: "Colombia (+57)", maxDigits: 10 },
  { code: "+385", label: "Croatia (+385)", maxDigits: 9 },
  { code: "+357", label: "Cyprus (+357)", maxDigits: 8 },
  { code: "+420", label: "Czech Republic (+420)", maxDigits: 9 },
  { code: "+45", label: "Denmark (+45)", maxDigits: 8 },
  { code: "+20", label: "Egypt (+20)", maxDigits: 10 },
  { code: "+372", label: "Estonia (+372)", maxDigits: 8 },
  { code: "+358", label: "Finland (+358)", maxDigits: 10 },
  { code: "+33", label: "France (+33)", maxDigits: 9 },
  { code: "+995", label: "Georgia (+995)", maxDigits: 9 },
  { code: "+49", label: "Germany (+49)", maxDigits: 11 },
  { code: "+233", label: "Ghana (+233)", maxDigits: 9 },
  { code: "+30", label: "Greece (+30)", maxDigits: 10 },
  { code: "+852", label: "Hong Kong (+852)", maxDigits: 8 },
  { code: "+36", label: "Hungary (+36)", maxDigits: 9 },
  { code: "+354", label: "Iceland (+354)", maxDigits: 7 },
  { code: "+62", label: "Indonesia (+62)", maxDigits: 11 },
  { code: "+98", label: "Iran (+98)", maxDigits: 10 },
  { code: "+964", label: "Iraq (+964)", maxDigits: 10 },
  { code: "+353", label: "Ireland (+353)", maxDigits: 9 },
  { code: "+972", label: "Israel (+972)", maxDigits: 9 },
  { code: "+39", label: "Italy (+39)", maxDigits: 10 },
  { code: "+81", label: "Japan (+81)", maxDigits: 11 },
  { code: "+962", label: "Jordan (+962)", maxDigits: 9 },
  { code: "+7", label: "Kazakhstan / Russia (+7)", maxDigits: 10 },
  { code: "+254", label: "Kenya (+254)", maxDigits: 9 },
  { code: "+965", label: "Kuwait (+965)", maxDigits: 8 },
  { code: "+996", label: "Kyrgyzstan (+996)", maxDigits: 9 },
  { code: "+856", label: "Laos (+856)", maxDigits: 10 },
  { code: "+371", label: "Latvia (+371)", maxDigits: 8 },
  { code: "+961", label: "Lebanon (+961)", maxDigits: 8 },
  { code: "+370", label: "Lithuania (+370)", maxDigits: 8 },
  { code: "+352", label: "Luxembourg (+352)", maxDigits: 9 },
  { code: "+853", label: "Macau (+853)", maxDigits: 8 },
  { code: "+60", label: "Malaysia (+60)", maxDigits: 10 },
  { code: "+960", label: "Maldives (+960)", maxDigits: 7 },
  { code: "+356", label: "Malta (+356)", maxDigits: 8 },
  { code: "+52", label: "Mexico (+52)", maxDigits: 10 },
  { code: "+976", label: "Mongolia (+976)", maxDigits: 8 },
  { code: "+212", label: "Morocco (+212)", maxDigits: 9 },
  { code: "+95", label: "Myanmar (+95)", maxDigits: 9 },
  { code: "+977", label: "Nepal (+977)", maxDigits: 10 },
  { code: "+31", label: "Netherlands (+31)", maxDigits: 9 },
  { code: "+64", label: "New Zealand (+64)", maxDigits: 9 },
  { code: "+234", label: "Nigeria (+234)", maxDigits: 10 },
  { code: "+47", label: "Norway (+47)", maxDigits: 8 },
  { code: "+968", label: "Oman (+968)", maxDigits: 8 },
  { code: "+92", label: "Pakistan (+92)", maxDigits: 10 },
  { code: "+970", label: "Palestine (+970)", maxDigits: 9 },
  { code: "+507", label: "Panama (+507)", maxDigits: 8 },
  { code: "+63", label: "Philippines (+63)", maxDigits: 10 },
  { code: "+48", label: "Poland (+48)", maxDigits: 9 },
  { code: "+351", label: "Portugal (+351)", maxDigits: 9 },
  { code: "+974", label: "Qatar (+974)", maxDigits: 8 },
  { code: "+40", label: "Romania (+40)", maxDigits: 10 },
  { code: "+250", label: "Rwanda (+250)", maxDigits: 9 },
  { code: "+966", label: "Saudi Arabia (+966)", maxDigits: 9 },
  { code: "+65", label: "Singapore (+65)", maxDigits: 8 },
  { code: "+421", label: "Slovakia (+421)", maxDigits: 9 },
  { code: "+386", label: "Slovenia (+386)", maxDigits: 8 },
  { code: "+27", label: "South Africa (+27)", maxDigits: 9 },
  { code: "+82", label: "South Korea (+82)", maxDigits: 10 },
  { code: "+34", label: "Spain (+34)", maxDigits: 9 },
  { code: "+94", label: "Sri Lanka (+94)", maxDigits: 9 },
  { code: "+46", label: "Sweden (+46)", maxDigits: 9 },
  { code: "+41", label: "Switzerland (+41)", maxDigits: 9 },
  { code: "+886", label: "Taiwan (+886)", maxDigits: 9 },
  { code: "+992", label: "Tajikistan (+992)", maxDigits: 9 },
  { code: "+255", label: "Tanzania (+255)", maxDigits: 9 },
  { code: "+66", label: "Thailand (+66)", maxDigits: 9 },
  { code: "+216", label: "Tunisia (+216)", maxDigits: 8 },
  { code: "+90", label: "Turkey (+90)", maxDigits: 10 },
  { code: "+993", label: "Turkmenistan (+993)", maxDigits: 8 },
  { code: "+256", label: "Uganda (+256)", maxDigits: 9 },
  { code: "+380", label: "Ukraine (+380)", maxDigits: 9 },
  { code: "+971", label: "UAE (+971)", maxDigits: 9 },
  { code: "+44", label: "UK (+44)", maxDigits: 11 },
  { code: "+1", label: "USA / Canada (+1)", maxDigits: 10 },
  { code: "+998", label: "Uzbekistan (+998)", maxDigits: 9 },
  { code: "+58", label: "Venezuela (+58)", maxDigits: 10 },
  { code: "+84", label: "Vietnam (+84)", maxDigits: 9 },
  { code: "+967", label: "Yemen (+967)", maxDigits: 9 },
  { code: "+260", label: "Zambia (+260)", maxDigits: 9 },
  { code: "+263", label: "Zimbabwe (+263)", maxDigits: 9 },
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

/** India (+91): show state dropdown; other codes hide state and use country text field. */
export function isIndiaCountryCode(countryCode: string): boolean {
  return countryCode === DEFAULT_COUNTRY_CODE;
}
