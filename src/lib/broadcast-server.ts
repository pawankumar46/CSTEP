import { getApiBaseUrl } from "@/lib/env";
import {
  extractBroadcastSessionList,
  mapApiBroadcastSession,
  toCreateBroadcastSessionPayload,
} from "@/lib/broadcast-mappers";
import type {
  BroadcastSession,
  BroadcastSessionSummary,
  BroadcastUrlTarget,
  CreateBroadcastSessionPayload,
} from "@/types";

function getBackendUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

function authHeaders(authorization: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (authorization) headers.Authorization = authorization;
  return headers;
}

export function toBroadcastSessionSummary(session: BroadcastSession): BroadcastSessionSummary {
  return {
    id: session.id,
    eventId: session.eventId,
    eventTitle: session.eventTitle,
    broadcasterId: session.broadcasterId,
    broadcasterName: session.broadcasterName,
    name: session.name,
    isPrimary: session.isPrimary,
    streamKey: session.streamKey,
    ingestUrl: session.ingestUrl,
    playbackUrl: session.playbackUrl,
    ingestUrls: session.ingestUrls,
    playbackUrls: session.playbackUrls,
    isActive: session.isActive,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
  };
}

export function readBroadcastUrl(
  session: Pick<
    BroadcastSession,
    "ingestUrl" | "playbackUrl" | "ingestUrls" | "playbackUrls" | "streamKey"
  >,
  target: BroadcastUrlTarget,
): string | undefined {
  switch (target) {
    case "ingest.url":
      return session.ingestUrl;
    case "ingest.rtmp":
      return session.ingestUrls.rtmp;
    case "ingest.rtsp":
      return session.ingestUrls.rtsp;
    case "ingest.webrtc":
      return session.ingestUrls.webrtc;
    case "playback.url":
      return session.playbackUrl;
    case "playback.hls":
      return session.playbackUrls.hls;
    case "playback.rtsp":
      return session.playbackUrls.rtsp;
    case "playback.webrtc":
      return session.playbackUrls.webrtc;
    case "stream_key":
      return session.streamKey || undefined;
    default:
      return undefined;
  }
}

export async function fetchBackendBroadcastSessions(
  authorization: string | null,
  eventId: string,
): Promise<BroadcastSession[]> {
  const trimmed = eventId.trim();
  if (!trimmed) {
    throw new Error("eventId is required");
  }

  const response = await fetch(
    getBackendUrl(`/events/event/${encodeURIComponent(trimmed)}/broadcast_sessions/`),
    {
      headers: authHeaders(authorization),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to load broadcast sessions (${response.status})`);
  }

  const data: unknown = await response.json();
  return extractBroadcastSessionList(data).map(mapApiBroadcastSession);
}

export async function fetchBackendBroadcastSessionsForEvents(
  authorization: string | null,
  eventIds: string[],
): Promise<BroadcastSession[]> {
  const uniqueIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const results = await Promise.all(
    uniqueIds.map((eventId) => fetchBackendBroadcastSessions(authorization, eventId)),
  );
  return results.flat();
}

export async function createBackendBroadcastSession(
  authorization: string | null,
  payload: CreateBroadcastSessionPayload,
): Promise<BroadcastSession> {
  const response = await fetch(
    getBackendUrl(`/events/event/${encodeURIComponent(payload.eventId)}/broadcast_sessions/`),
    {
      method: "POST",
      headers: authHeaders(authorization),
      body: JSON.stringify(toCreateBroadcastSessionPayload(payload)),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to create broadcast session (${response.status})`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return mapApiBroadcastSession(data);
}

export const BROADCAST_URL_TARGETS: BroadcastUrlTarget[] = [
  "ingest.url",
  "ingest.rtmp",
  "ingest.rtsp",
  "ingest.webrtc",
  "playback.url",
  "playback.hls",
  "playback.rtsp",
  "playback.webrtc",
  "stream_key",
];

export function isBroadcastUrlTarget(value: string): value is BroadcastUrlTarget {
  return BROADCAST_URL_TARGETS.includes(value as BroadcastUrlTarget);
}
