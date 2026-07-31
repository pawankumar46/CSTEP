import { NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { fetchIpWhoisLocation } from "@/lib/ipwhois";
import type { ClientLocationInfo } from "@/lib/ipwhois-api-contract";

export async function GET(request: Request) {
  const clientIp = getClientIpFromRequest(request);

  try {
    // Prefer request IP when known; otherwise omit IP so ipwho.is uses the caller.
    // @see https://ipwhois.io/documentation#overview
    const location = await fetchIpWhoisLocation(clientIp);
    return NextResponse.json({
      ...location,
      error: null,
    } satisfies ClientLocationInfo & { error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ipwhois lookup failed";
    return NextResponse.json(
      {
        ip: clientIp,
        region: null,
        latitude: null,
        longitude: null,
        error: message,
      } satisfies ClientLocationInfo & { error: string },
      { status: 502 },
    );
  }
}
