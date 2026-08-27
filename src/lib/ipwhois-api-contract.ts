/**
 * Subset of https://ipwho.is/ response used by location logging.
 * @see https://ipwhois.io/documentation#overview
 */
export interface IpWhoisLocationFields {
  ip?: string;
  success?: boolean;
  message?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

/** App-facing location snapshot from ipwhois. */
export interface ClientLocationInfo {
  ip: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export const IPWHOIS_LOCATION_FIELDS =
  "ip,success,message,region,country,latitude,longitude" as const;
