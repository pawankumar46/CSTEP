/** Trim env values; blank strings are treated as unset. */
function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/^\uFEFF/, "").trim();
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
    case "NEXT_PUBLIC_WS_URL":
      return trimEnv(process.env.NEXT_PUBLIC_WS_URL);
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
    case "NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS":
      return trimEnv(process.env.NEXT_PUBLIC_STREAM_OPEN_TO_BASE_USERS);
    case "VERCEL_URL":
      return trimEnv(process.env.VERCEL_URL);
    default:
      return trimEnv(process.env[name]);
  }
}

/** Django / REST API origin. Set NEXT_PUBLIC_API_URL in .env.local (http or https — used as-is). */
export function getApiBaseUrl(): string {
  const url = readPublicEnv("NEXT_PUBLIC_API_URL");
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example).",
    );
  }

  const normalized = normalizeBaseUrl(url);
  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be an absolute URL.",
    );
  }

  // Preserve the protocol exactly as configured — never upgrade http → https.
  return normalized;
}

/**
 * WebSocket origin for live analytics.
 * Prefer `NEXT_PUBLIC_WS_URL` in `.env.local` (e.g. `wss://your-api.example.com`).
 * Falls back to deriving `ws`/`wss` from `NEXT_PUBLIC_API_URL`.
 */
export function getWebSocketBaseUrl(): string {
  const explicit = readPublicEnv("NEXT_PUBLIC_WS_URL");
  if (explicit) {
    const normalized = normalizeBaseUrl(explicit);
    if (!/^wss?:\/\//i.test(normalized)) {
      throw new Error(
        "NEXT_PUBLIC_WS_URL must be an absolute WebSocket URL.",
      );
    }
    return normalized;
  }

  const api = getApiBaseUrl();
  if (api.startsWith("https://")) return `wss://${api.slice("https://".length)}`;
  if (api.startsWith("http://")) return `ws://${api.slice("http://".length)}`;
  throw new Error(
    "Set NEXT_PUBLIC_WS_URL in .env.local, or provide NEXT_PUBLIC_API_URL to derive the WebSocket host.",
  );
}

/** Public frontend origin for absolute links (share, emails). */
export function getAppBaseUrl(): string | undefined {
  const explicit = readPublicEnv("NEXT_PUBLIC_APP_URL");
  if (explicit) return normalizeBaseUrl(explicit);

  const vercel = readPublicEnv("VERCEL_URL");
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
