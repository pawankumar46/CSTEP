import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_FILE_ID = "1GwhnrClhI3WF-SO-lYmIZ8l3-YETBBP-";
const resolvedUrlCache = new Map<string, string>();

const DRIVE_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

function buildDriveCandidates(fileId: string): string[] {
  return [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${encodeURIComponent(fileId)}`,
  ];
}

async function resolveDriveStreamUrl(fileId: string): Promise<string> {
  const cached = resolvedUrlCache.get(fileId);
  if (cached) {
    return cached;
  }

  for (const candidate of buildDriveCandidates(fileId)) {
    const initial = await fetch(candidate, {
      headers: DRIVE_HEADERS,
      redirect: "follow",
    });
    const contentType = initial.headers.get("content-type") ?? "";

    if (contentType.includes("video/") || contentType.includes("application/octet-stream")) {
      resolvedUrlCache.set(fileId, candidate);
      return candidate;
    }

    if (!contentType.includes("text/html")) {
      continue;
    }

    const html = await initial.text();
    const uuid = html.match(/name="uuid"\s+value="([^"]+)"/)?.[1];
    const id = html.match(/name="id"\s+value="([^"]+)"/)?.[1] ?? fileId;

    if (uuid) {
      const confirmedUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t&uuid=${encodeURIComponent(uuid)}`;
      resolvedUrlCache.set(fileId, confirmedUrl);
      return confirmedUrl;
    }
  }

  const fallback = buildDriveCandidates(fileId)[0];
  resolvedUrlCache.set(fileId, fallback);
  return fallback;
}

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("fileId") ?? DEFAULT_FILE_ID;
  const range = request.headers.get("range");

  try {
    const streamUrl = await resolveDriveStreamUrl(fileId);
    const upstreamHeaders: Record<string, string> = {
      ...(DRIVE_HEADERS as Record<string, string>),
    };
    if (range) {
      upstreamHeaders.Range = range;
    }

    const upstream = await fetch(streamUrl, {
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!upstream.ok) {
      resolvedUrlCache.delete(fileId);
      return NextResponse.json({ error: "Failed to load video stream" }, { status: upstream.status });
    }

    const upstreamType = upstream.headers.get("content-type") ?? "";
    if (upstreamType.includes("text/html")) {
      resolvedUrlCache.delete(fileId);
      return NextResponse.json({ error: "Stream URL expired" }, { status: 502 });
    }

    const responseHeaders = new Headers();
    const passThrough = ["content-type", "content-length", "content-range", "accept-ranges"];
    for (const key of passThrough) {
      const value = upstream.headers.get(key);
      if (value) {
        responseHeaders.set(key, value);
      }
    }

    if (!responseHeaders.has("content-type")) {
      responseHeaders.set("content-type", "video/mp4");
    }
    if (!responseHeaders.has("accept-ranges")) {
      responseHeaders.set("accept-ranges", "bytes");
    }

    responseHeaders.set("cache-control", "public, max-age=300");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    resolvedUrlCache.delete(fileId);
    return NextResponse.json({ error: "Failed to load video stream" }, { status: 500 });
  }
}
