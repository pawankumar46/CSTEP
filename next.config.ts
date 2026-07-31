import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.API_URL?.trim();

const wsUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
const liveStreamUrl = process.env.NEXT_PUBLIC_LIVE_STREAM_URL?.trim();
const liveStreamFileId = process.env.NEXT_PUBLIC_LIVE_STREAM_FILE_ID?.trim();

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    ...(apiUrl ? { NEXT_PUBLIC_API_URL: apiUrl } : {}),
    ...(wsUrl ? { NEXT_PUBLIC_WS_URL: wsUrl } : {}),
    ...(appUrl ? { NEXT_PUBLIC_APP_URL: appUrl } : {}),
    ...(liveStreamUrl ? { NEXT_PUBLIC_LIVE_STREAM_URL: liveStreamUrl } : {}),
    ...(liveStreamFileId ? { NEXT_PUBLIC_LIVE_STREAM_FILE_ID: liveStreamFileId } : {}),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
