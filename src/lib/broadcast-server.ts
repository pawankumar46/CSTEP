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
    isActive: session.isActive,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
  };
}

export function readBroadcastUrl(session: BroadcastSession, target: BroadcastUrlTarget): string | undefined {
  switch (target) {
    case "ingest.rtmp":
      return session.ingestUrls.rtmp;
    case "ingest.rtsp":
      return session.ingestUrls.rtsp;
    case "ingest.webrtc":
      return session.ingestUrls.webrtc;
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
): Promise<BroadcastSession[]> {
  const response = await fetch(getBackendUrl("/events/broadcast-sessions/"), {
    headers: authHeaders(authorization),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to load broadcast sessions (${response.status})`);
  }

  const data: unknown = await response.json();
  return extractBroadcastSessionList(data).map(mapApiBroadcastSession);
}

export async function createBackendBroadcastSession(
  authorization: string | null,
  payload: CreateBroadcastSessionPayload,
): Promise<BroadcastSession> {
  const response = await fetch(getBackendUrl("/events/broadcast-sessions/"), {
    method: "POST",
    headers: authHeaders(authorization),
    body: JSON.stringify(toCreateBroadcastSessionPayload(payload)),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Failed to create broadcast session (${response.status})`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return mapApiBroadcastSession(data);
}

export const BROADCAST_URL_TARGETS: BroadcastUrlTarget[] = [
  "ingest.rtmp",
  "ingest.rtsp",
  "ingest.webrtc",
  "playback.hls",
  "playback.rtsp",
  "playback.webrtc",
  "stream_key",
];

export function isBroadcastUrlTarget(value: string): value is BroadcastUrlTarget {
  return BROADCAST_URL_TARGETS.includes(value as BroadcastUrlTarget);
}
