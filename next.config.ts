import type { NextConfig } from "next";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.trim() || process.env.API_URL?.trim();

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    ...(apiUrl ? { NEXT_PUBLIC_API_URL: apiUrl } : {}),
    ...(appUrl ? { NEXT_PUBLIC_APP_URL: appUrl } : {}),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
