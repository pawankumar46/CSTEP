"use client";

import { StreamAccessGuard } from "@/components/streaming/StreamAccessGuard";

export default function StreamingLayout({ children }: { children: React.ReactNode }) {
  return <StreamAccessGuard>{children}</StreamAccessGuard>;
}
