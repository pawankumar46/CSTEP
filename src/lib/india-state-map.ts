import type { DistributionDataPoint } from "@/types";

/** Canonical map state names (match GeoJSON `properties.name`). */
export const INDIA_MAP_STATE_NAMES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

const STATE_ALIASES: Record<string, string> = {
  "nct of delhi": "Delhi",
  "nct delhi": "Delhi",
  "new delhi": "Delhi",
  delhi: "Delhi",
  orissa: "Odisha",
  odisha: "Odisha",
  pondicherry: "Puducherry",
  puducherry: "Puducherry",
  uttaranchal: "Uttarakhand",
  uttarakhand: "Uttarakhand",
  "jammu & kashmir": "Jammu and Kashmir",
  "j&k": "Jammu and Kashmir",
  "jammu and kashmir": "Jammu and Kashmir",
  "andaman & nicobar": "Andaman and Nicobar Islands",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
  "andaman and nicobar": "Andaman and Nicobar Islands",
  "andaman and nicobar islands": "Andaman and Nicobar Islands",
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
  "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "tamilnadu": "Tamil Nadu",
  "tamil nadu": "Tamil Nadu",
  "west bengal": "West Bengal",
  "madhya pradesh": "Madhya Pradesh",
  "uttar pradesh": "Uttar Pradesh",
  "himachal pradesh": "Himachal Pradesh",
  "andhra pradesh": "Andhra Pradesh",
  "arunachal pradesh": "Arunachal Pradesh",
};

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ");
}

/** Map API / chart labels onto GeoJSON state names. */
export function resolveIndiaMapStateName(label: string): string | null {
  const key = normalizeKey(label);
  if (!key || key === "unspecified" || key === "unknown" || key === "other" || key === "others") {
    return null;
  }
  if (STATE_ALIASES[key]) return STATE_ALIASES[key];
  const exact = INDIA_MAP_STATE_NAMES.find((name) => normalizeKey(name) === key);
  return exact ?? null;
}

export function buildIndiaStateCountMap(
  points: DistributionDataPoint[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const point of points) {
    const state = resolveIndiaMapStateName(point.name);
    if (!state) continue;
    counts.set(state, (counts.get(state) ?? 0) + point.value);
  }
  return counts;
}

/** Blue intensity scale for choropleth fills. */
export function indiaStateFillColor(count: number, maxCount: number): string {
  if (count <= 0 || maxCount <= 0) return "hsl(var(--muted) / 0.45)";
  const t = Math.min(1, count / maxCount);
  // soft → strong blue
  const lightness = 88 - t * 48;
  const saturation = 55 + t * 30;
  return `hsl(210 ${saturation}% ${lightness}%)`;
}
