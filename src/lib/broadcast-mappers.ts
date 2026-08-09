import type { BroadcastSession, BroadcastStreamUrls, CreateBroadcastSessionPayload } from "@/types";

function parseNumericId(value: string): number {
  const id = Number(value);
  if (Number.isNaN(id)) {
    throw new Error("Invalid id");
  }
  return id;
}

export function toCreateBroadcastSessionPayload(data: CreateBroadcastSessionPayload) {
  return {
    event: parseNumericId(data.eventId),
    broadcaster: parseNumericId(data.broadcasterId),
    name: data.name.trim(),
    is_primary: data.isPrimary,
  };
}

export function extractBroadcastSessionList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

function mapStreamUrls(raw: unknown): BroadcastStreamUrls {
  if (!raw || typeof raw !== "object") return {};

  const urls = raw as Record<string, unknown>;
  return {
    rtmp: urls.rtmp ? String(urls.rtmp) : undefined,
    rtsp: urls.rtsp ? String(urls.rtsp) : undefined,
    webrtc: urls.webrtc ? String(urls.webrtc) : undefined,
    hls: urls.hls ? String(urls.hls) : undefined,
  };
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

export function mapApiBroadcastSession(raw: Record<string, unknown>): BroadcastSession {
  const playbackUrls = mapStreamUrls(raw.playback_urls ?? raw.playbackUrls);
  const ingestUrl = nullableString(raw.ingest_url ?? raw.ingestUrl) ?? undefined;
  const playbackUrl = nullableString(raw.playback_url ?? raw.playbackUrl) ?? undefined;

  return {
    id: String(raw.id ?? raw.pk ?? ""),
    eventId: String(raw.event ?? raw.event_id ?? ""),
    eventTitle: String(raw.event_title ?? raw.eventTitle ?? ""),
    broadcasterId: String(raw.broadcaster ?? raw.broadcaster_id ?? ""),
    broadcasterName: String(raw.broadcaster_name ?? raw.broadcasterName ?? ""),
    name: String(raw.name ?? ""),
    isPrimary: Boolean(raw.is_primary ?? raw.isPrimary),
    streamKey: String(raw.stream_key ?? raw.streamKey ?? ""),
    ingestUrl,
    playbackUrl,
    ingestUrls: mapStreamUrls(raw.ingest_urls ?? raw.ingestUrls),
    playbackUrls,
    isActive: Boolean(raw.is_active ?? raw.isActive),
    startedAt: nullableString(raw.started_at ?? raw.startedAt),
    endedAt: nullableString(raw.ended_at ?? raw.endedAt),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ""),
    liveVideoUrl: playbackUrl,
  };
}
