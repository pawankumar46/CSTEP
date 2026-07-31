/** Best-effort client IP from incoming request headers (proxy-aware). */
export function getClientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first && !isPrivateOrLocalIp(first)) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && !isPrivateOrLocalIp(realIp)) return realIp;

  const cfConnecting = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnecting && !isPrivateOrLocalIp(cfConnecting)) return cfConnecting;

  return null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "127.0.0.1" || value === "localhost") return true;
  if (value.startsWith("10.")) return true;
  if (value.startsWith("192.168.")) return true;
  if (value.startsWith("169.254.")) return true;
  const match = /^172\.(\d+)\./.exec(value);
  if (match) {
    const octet = Number(match[1]);
    if (octet >= 16 && octet <= 31) return true;
  }
  return false;
}
