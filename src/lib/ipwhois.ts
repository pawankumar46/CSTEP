import {
  IPWHOIS_LOCATION_FIELDS,
  type ClientLocationInfo,
  type IpWhoisLocationFields,
} from "@/lib/ipwhois-api-contract";

const IPWHOIS_LOOKUP_BASE = "https://ipwho.is";

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapIpWhoisToClientLocation(data: IpWhoisLocationFields): ClientLocationInfo {
  return {
    ip: pickString(data.ip),
    region: pickString(data.region),
    latitude: pickNumber(data.latitude),
    longitude: pickNumber(data.longitude),
  };
}

/** Lookup via free endpoint: https://ipwho.is/{ip}?fields=... (omit ip for caller IP). */
export async function fetchIpWhoisLocation(ip?: string | null): Promise<ClientLocationInfo> {
  const trimmed = ip?.trim() || "";
  const path = trimmed ? `/${encodeURIComponent(trimmed)}` : "/";
  const url = `${IPWHOIS_LOOKUP_BASE}${path}?fields=${IPWHOIS_LOCATION_FIELDS}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ipwhois lookup failed (${response.status})`);
  }

  const data = (await response.json()) as IpWhoisLocationFields;
  if (data.success === false) {
    throw new Error(data.message?.trim() || "ipwhois lookup was not successful");
  }

  return mapIpWhoisToClientLocation(data);
}
