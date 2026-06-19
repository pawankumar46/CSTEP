/** Read a public env var, treating blank values as unset. */
export function readPublicEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readFirstPublicEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = readPublicEnv(name);
    if (value) return value;
  }
  return undefined;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/** Django / REST API origin. Supports NEXT_PUBLIC_API_URL or API_URL (via next.config). */
export function getApiBaseUrl(): string {
  return normalizeBaseUrl(
    readFirstPublicEnv(["NEXT_PUBLIC_API_URL", "API_URL"]) ??
      "https://cstep-django.vercel.app",
  );
}

/**
 * Public frontend origin for absolute links (share, emails).
 * Set NEXT_PUBLIC_APP_URL in .env.local — not .env.example (that file is not loaded).
 */
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
