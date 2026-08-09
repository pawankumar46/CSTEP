import { getAccessToken } from "@/lib/auth-session";
import { readBroadcastUrl } from "@/lib/broadcast-server";
import type {
  BroadcastSessionSummary,
  CreateBroadcastSessionPayload,
  BroadcastUrlTarget,
} from "@/types";

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export interface LiveBroadcastCamera {
  id: string;
  name: string;
  playbackUrl: string;
  isPrimary: boolean;
  isActive: boolean;
}

function sortLiveCameras(a: LiveBroadcastCamera, b: LiveBroadcastCamera): number {
  if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
  return a.name.localeCompare(b.name);
}

export function pickDefaultLiveCamera(
  cameras: LiveBroadcastCamera[],
): LiveBroadcastCamera | null {
  if (cameras.length === 0) return null;
  return (
    cameras.find((camera) => camera.isPrimary && camera.isActive) ??
    cameras.find((camera) => camera.isActive) ??
    cameras.find((camera) => camera.isPrimary) ??
    cameras[0]
  );
}

export const getBroadcastSessions = async (eventId: string): Promise<BroadcastSessionSummary[]> => {
  const response = await fetch(
    `/api/broadcast-sessions?eventId=${encodeURIComponent(eventId)}`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<BroadcastSessionSummary[]>;
};

/** Active/playable cameras from GET /events/event/:id/broadcast_sessions/. */
export const getLiveBroadcastCameras = async (
  eventId: string,
): Promise<LiveBroadcastCamera[]> => {
  if (!eventId.trim()) return [];

  const sessions = await getBroadcastSessions(eventId);
  return sessions
    .filter((session) => Boolean(session.playbackUrl?.trim()))
    .map((session) => ({
      id: session.id,
      name: session.name.trim() || `Camera ${session.id}`,
      playbackUrl: session.playbackUrl!.trim(),
      isPrimary: session.isPrimary,
      isActive: session.isActive,
    }))
    .sort(sortLiveCameras);
};

export const getBroadcastSessionsForEvents = async (
  eventIds: string[],
): Promise<BroadcastSessionSummary[]> => {
  const uniqueIds = [...new Set(eventIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const response = await fetch(
    `/api/broadcast-sessions?eventIds=${encodeURIComponent(uniqueIds.join(","))}`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<BroadcastSessionSummary[]>;
};

export const createBroadcastSession = async (
  payload: CreateBroadcastSessionPayload,
): Promise<BroadcastSessionSummary[]> => {
  const response = await fetch("/api/broadcast-sessions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<BroadcastSessionSummary[]>;
};

export const resolveBroadcastUrl = (
  session: BroadcastSessionSummary,
  target: BroadcastUrlTarget,
): string | null => {
  return readBroadcastUrl(session, target) ?? null;
};

export const fetchBroadcastUrl = async (
  sessionId: string,
  target: BroadcastUrlTarget,
  eventId: string,
): Promise<string> => {
  const response = await fetch(
    `/api/broadcast-sessions/${encodeURIComponent(sessionId)}/url?target=${encodeURIComponent(target)}&eventId=${encodeURIComponent(eventId)}`,
    { headers: authHeaders(), cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("URL not returned");
  return data.url;
};

/** Prefer primary active session playback_url from GET /events/event/:id/broadcast_sessions/. */
export const resolveLivePlaybackUrl = async (eventId: string): Promise<string | null> => {
  try {
    const cameras = await getLiveBroadcastCameras(eventId);
    return pickDefaultLiveCamera(cameras)?.playbackUrl ?? null;
  } catch {
    return null;
  }
};
