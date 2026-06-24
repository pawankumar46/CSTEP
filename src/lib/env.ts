/** Trim env values; blank strings are treated as unset. */
function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Read a public env var on the client.
 * Next.js only inlines static `process.env.NEXT_PUBLIC_*` references — not dynamic keys.
 */
export function readPublicEnv(name: string): string | undefined {
  switch (name) {
    case "NEXT_PUBLIC_API_URL":
      return trimEnv(process.env.NEXT_PUBLIC_API_URL);
    case "NEXT_PUBLIC_APP_URL":
      return trimEnv(process.env.NEXT_PUBLIC_APP_URL);
    case "NEXT_PUBLIC_BRAND_LOGO_DARK_SRC":
      return trimEnv(process.env.NEXT_PUBLIC_BRAND_LOGO_DARK_SRC);
    case "NEXT_PUBLIC_LIVE_STREAM_URL":
      return trimEnv(process.env.NEXT_PUBLIC_LIVE_STREAM_URL);
    case "NEXT_PUBLIC_LIVE_STREAM_FILE_ID":
      return trimEnv(process.env.NEXT_PUBLIC_LIVE_STREAM_FILE_ID);
    case "NEXT_PUBLIC_STREAM_LEFT_BANNER_URL":
      return trimEnv(process.env.NEXT_PUBLIC_STREAM_LEFT_BANNER_URL);
    case "NEXT_PUBLIC_STREAM_RIGHT_BANNER_URL":
      return trimEnv(process.env.NEXT_PUBLIC_STREAM_RIGHT_BANNER_URL);
    case "VERCEL_URL":
      return trimEnv(process.env.VERCEL_URL);
    default:
      return trimEnv(process.env[name]);
  }
}

/** Django / REST API origin. Set NEXT_PUBLIC_API_URL in .env.local */
export function getApiBaseUrl(): string {
  const url = trimEnv(process.env.NEXT_PUBLIC_API_URL);
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  return normalizeBaseUrl(url);
}

/** Public frontend origin for absolute links (share, emails). */
export function getAppBaseUrl(): string | undefined {
  const explicit = trimEnv(process.env.NEXT_PUBLIC_APP_URL);
  if (explicit) return normalizeBaseUrl(explicit);

  const vercel = trimEnv(process.env.VERCEL_URL);
  if (vercel) return `https://${normalizeBaseUrl(vercel)}`;

  return undefined;
}

/** Build an absolute app URL; falls back to the current browser origin on the client. */
export function getAppUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getAppBaseUrl();

  if (base) return `${base}${normalizedPath}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalizedPath}`;
  }

  return normalizedPath;
}
