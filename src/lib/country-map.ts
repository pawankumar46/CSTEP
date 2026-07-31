import type { DistributionDataPoint } from "@/types";

/**
 * Map API / chart country labels onto world GeoJSON `properties.name`
 * (`public/maps/world-countries.geojson`).
 */
const COUNTRY_ALIASES: Record<string, string> = {
  usa: "USA",
  us: "USA",
  "u.s.": "USA",
  "u.s.a.": "USA",
  "united states": "USA",
  "united states of america": "USA",
  america: "USA",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "united kingdom": "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  uae: "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  russia: "Russia",
  "russian federation": "Russia",
  "south korea": "South Korea",
  "republic of korea": "South Korea",
  korea: "South Korea",
  "north korea": "North Korea",
  "dprk": "North Korea",
  iran: "Iran",
  "islamic republic of iran": "Iran",
  syria: "Syria",
  "syrian arab republic": "Syria",
  venezuela: "Venezuela",
  bolivia: "Bolivia",
  tanzania: "United Republic of Tanzania",
  "united republic of tanzania": "United Republic of Tanzania",
  "czech republic": "Czechia",
  czechia: "Czechia",
  "ivory coast": "Côte d'Ivoire",
  "cote divoire": "Côte d'Ivoire",
  "côte d'ivoire": "Côte d'Ivoire",
  "democratic republic of the congo": "Democratic Republic of the Congo",
  "dr congo": "Democratic Republic of the Congo",
  "drc": "Democratic Republic of the Congo",
  congo: "Republic of the Congo",
  "republic of the congo": "Republic of the Congo",
  myanmar: "Myanmar",
  burma: "Myanmar",
  vietnam: "Vietnam",
  laos: "Laos",
  brunei: "Brunei",
  "brunei darussalam": "Brunei",
  palestine: "Palestine",
  "west bank": "Palestine",
  taiwan: "Taiwan",
  "republic of china": "Taiwan",
  "hong kong": "China",
  "hong kong sar": "China",
  macau: "China",
  macao: "China",
  india: "India",
  japan: "Japan",
  france: "France",
  germany: "Germany",
  canada: "Canada",
  australia: "Australia",
  china: "China",
  brazil: "Brazil",
  mexico: "Mexico",
  singapore: "Singapore",
  "saudi arabia": "Saudi Arabia",
  netherlands: "Netherlands",
  switzerland: "Switzerland",
  sweden: "Sweden",
  norway: "Norway",
  denmark: "Denmark",
  finland: "Finland",
  italy: "Italy",
  spain: "Spain",
  portugal: "Portugal",
  poland: "Poland",
  turkey: "Turkey",
  egypt: "Egypt",
  "south africa": "South Africa",
  nigeria: "Nigeria",
  kenya: "Kenya",
  indonesia: "Indonesia",
  malaysia: "Malaysia",
  thailand: "Thailand",
  philippines: "Philippines",
  "new zealand": "New Zealand",
  ireland: "Ireland",
  belgium: "Belgium",
  austria: "Austria",
  greece: "Greece",
  israel: "Israel",
  pakistan: "Pakistan",
  bangladesh: "Bangladesh",
  "sri lanka": "Sri Lanka",
  nepal: "Nepal",
  bhutan: "Bhutan",
  afghanistan: "Afghanistan",
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ");
}

/** Canonical GeoJSON names we care about for alias fallback / listing unmatched. */
let geoCountryNames: string[] | null = null;

export function setWorldGeoCountryNames(names: string[]) {
  geoCountryNames = names;
}

/** Map API / chart labels onto GeoJSON country names. */
export function resolveWorldCountryName(label: string): string | null {
  const key = normalizeKey(label);
  if (!key || key === "unspecified" || key === "unknown" || key === "other" || key === "others") {
    return null;
  }
  if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
  if (geoCountryNames) {
    const exact = geoCountryNames.find((name) => normalizeKey(name) === key);
    if (exact) return exact;
  }
  return null;
}

export function buildCountryCountMap(
  points: DistributionDataPoint[],
  geoNames?: string[],
): Map<string, number> {
  if (geoNames) setWorldGeoCountryNames(geoNames);
  const counts = new Map<string, number>();
  for (const point of points) {
    const country = resolveWorldCountryName(point.name);
    if (!country) continue;
    counts.set(country, (counts.get(country) ?? 0) + point.value);
  }
  return counts;
}

/** Blue intensity scale for choropleth fills (matches India map). */
export function countryFillColor(count: number, maxCount: number): string {
  if (count <= 0 || maxCount <= 0) return "hsl(var(--muted) / 0.35)";
  const t = Math.min(1, count / maxCount);
  const lightness = 88 - t * 48;
  const saturation = 55 + t * 30;
  return `hsl(210 ${saturation}% ${lightness}%)`;
}
