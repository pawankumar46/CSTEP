import { getAccessToken } from "@/lib/auth-session";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { apiClient } from "@/lib/api-client";
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

export interface LiveEventStreamPayload {
  cameras: LiveBroadcastCamera[];
  concurrentViewers: number | null;
  videoMutedByDefault: boolean;
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

function findCameraByLabel(
  cameras: LiveBroadcastCamera[],
  label: string,
): LiveBroadcastCamera | null {
  const normalized = label.trim().toLowerCase();
  return (
    cameras.find((camera) => camera.name.trim().toLowerCase() === normalized) ??
    cameras.find((camera) => camera.name.trim().toLowerCase().includes(normalized)) ??
    null
  );
}

function cameraNumber(name: string): number | null {
  const match = name.trim().match(/camera\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

/** Camera 1 = main, Camera 2 = left, Camera 3 = right (by session name). */
export function pickStreamLayoutCameras(cameras: LiveBroadcastCamera[]): {
  main: LiveBroadcastCamera | null;
  left: LiveBroadcastCamera | null;
  right: LiveBroadcastCamera | null;
} {
  const byNumber = (n: number) =>
    cameras.find((camera) => cameraNumber(camera.name) === n) ?? null;

  return {
    main:
      findCameraByLabel(cameras, "Camera 1") ??
      byNumber(1) ??
      pickDefaultLiveCamera(cameras),
    left: findCameraByLabel(cameras, "Camera 2") ?? byNumber(2) ?? null,
    right: findCameraByLabel(cameras, "Camera 3") ?? byNumber(3) ?? null,
  };
}

/** @deprecated Use pickStreamLayoutCameras */
export function pickSideBannerCameras(cameras: LiveBroadcastCamera[]): {
  left: LiveBroadcastCamera | null;
  right: LiveBroadcastCamera | null;
} {
  const { left, right } = pickStreamLayoutCameras(cameras);
  return { left, right };
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

function mapEventBroadcastSessions(raw: unknown): LiveBroadcastCamera[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const session = item as Record<string, unknown>;
      const playbackUrl = String(session.playback_url ?? session.playbackUrl ?? "").trim();
      if (!playbackUrl) return null;

      return {
        id: String(session.id ?? ""),
        name: String(session.name ?? "").trim() || `Camera ${session.id ?? ""}`,
        playbackUrl,
        isPrimary: Boolean(session.is_primary ?? session.isPrimary),
        isActive: Boolean(session.is_active ?? session.isActive ?? true),
      } satisfies LiveBroadcastCamera;
    })
    .filter((camera): camera is LiveBroadcastCamera => camera !== null)
    .sort(sortLiveCameras);
}

/**
 * Watch Live cameras from GET /events/event/:id/ → `broadcast_sessions[].playback_url`.
 */
export const getLiveEventStream = async (
  eventId: string,
): Promise<LiveEventStreamPayload> => {
  if (!eventId.trim()) {
    return { cameras: [], concurrentViewers: null, videoMutedByDefault: true };
  }

  try {
    const { data } = await apiClient.get<Record<string, unknown>>(
      `/events/event/${encodeURIComponent(eventId)}/`,
    );
    const concurrent = data.concurrent_viewers ?? data.concurrentViewers;
    return {
      cameras: mapEventBroadcastSessions(data.broadcast_sessions ?? data.broadcastSessions),
      concurrentViewers:
        typeof concurrent === "number" && Number.isFinite(concurrent) ? concurrent : null,
      videoMutedByDefault: Boolean(
        data.video_muted_by_default ?? data.videoMutedByDefault ?? true,
      ),
    };
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Active/playable cameras — prefers event detail `broadcast_sessions`, falls back to sessions list. */
export const getLiveBroadcastCameras = async (
  eventId: string,
): Promise<LiveBroadcastCamera[]> => {
  if (!eventId.trim()) return [];

  try {
    const { cameras } = await getLiveEventStream(eventId);
    if (cameras.length > 0) return cameras;
  } catch {
    // Fall through to dedicated broadcast_sessions list.
  }

  const sessions = await getBroadcastSessions(eventId);
  return sessions
    .map((session) => {
      const playbackUrl = session.playbackUrl?.trim();
      if (!playbackUrl) return null;

      return {
        id: session.id,
        name: session.name.trim() || `Camera ${session.id}`,
        playbackUrl,
        isPrimary: session.isPrimary,
        isActive: session.isActive,
      };
    })
    .filter((camera): camera is LiveBroadcastCamera => camera !== null)
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
