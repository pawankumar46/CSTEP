export type StreamSourceType =
  | "google-drive-file"
  | "direct-video"
  | "hls-stream"
  | "iframe-embed"
  | "external-meeting"
  | "unknown";

export type MeetingPlatform = "google-meet" | "microsoft-teams";

export interface StreamSource {
  type: StreamSourceType;
  fileId?: string;
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
  meetingPlatform?: MeetingPlatform;
}

const GOOGLE_DRIVE_FILE_REGEX = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_FOLDER_REGEX = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_OPEN_REGEX = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_UC_REGEX = /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/;
const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const GOOGLE_MEET_REGEX = /(?:meet|stream\.meet)\.google\.com/i;
const MICROSOFT_TEAMS_REGEX = /(?:teams\.microsoft\.com|teams\.live\.com)/i;
const IFRAME_SRC_REGEX = /<iframe[^>]+src=["']([^"']+)["']/i;

export function isGoogleDriveStreamUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url.trim());
}

export function isYouTubeStreamUrl(url: string): boolean {
  return YOUTUBE_ID_REGEX.test(url.trim());
}

export function isGoogleMeetStreamUrl(url: string): boolean {
  return GOOGLE_MEET_REGEX.test(url.trim());
}

export function isMicrosoftTeamsStreamUrl(url: string): boolean {
  return MICROSOFT_TEAMS_REGEX.test(url.trim());
}

/** Teams Live Event embed URLs; consumer meet links on teams.live.com cannot be iframed. */
export function isTeamsEmbedSupportedUrl(url: string): boolean {
  const trimmed = url.trim();
  if (/teams\.live\.com/i.test(trimmed)) return false;
  if (/teams\.microsoft\.com\/convene\/meetings\//i.test(trimmed)) return true;
  if (/teams\.microsoft\.com\/l\/meetup-join\//i.test(trimmed)) return false;
  if (/[?&]embed=true(?:&|$)/i.test(trimmed)) return true;
  return false;
}

/** Embedded or meeting links that do not use HTML5 video volume controls. */
export function isEmbeddedPlaybackStreamUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    isGoogleDriveStreamUrl(trimmed)
    || isYouTubeStreamUrl(trimmed)
    || isGoogleMeetStreamUrl(trimmed)
    || isMicrosoftTeamsStreamUrl(trimmed)
  );
}

export function getMeetingPlatformLabel(platform?: MeetingPlatform): string {
  if (platform === "google-meet") return "Google Meet";
  if (platform === "microsoft-teams") return "Microsoft Teams";
  return "Live meeting";
}

export function buildYouTubeEmbedUrl(videoId: string, autoplay = true, muted = true): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

export function buildDriveEmbedUrl(fileId: string, autoplay = true): string {
  const base = `https://drive.google.com/file/d/${fileId}/preview`;
  return autoplay ? `${base}?autoplay=1` : base;
}

export function buildProxiedPlaybackUrl(fileId: string): string {
  return `/api/stream/video?fileId=${encodeURIComponent(fileId)}`;
}

function extractIframeSrc(value: string): string | null {
  const match = value.trim().match(IFRAME_SRC_REGEX);
  return match?.[1] ?? null;
}

function normalizeGoogleMeetUrl(url: string): string {
  return url
    .trim()
    .replace(/^https:\/\/stream\.meet\.google\.com/i, "https://meet.google.com");
}

export function buildTeamsEmbedUrl(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!parsed.searchParams.has("embed")) {
      parsed.searchParams.set("embed", "true");
    }
    return parsed.toString();
  } catch {
    const separator = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${separator}embed=true`;
  }
}

function toDriveFileSource(fileId: string, originalUrl: string): StreamSource {
  return {
    type: "google-drive-file",
    fileId,
    embedUrl: buildDriveEmbedUrl(fileId),
    directUrl: buildProxiedPlaybackUrl(fileId),
    originalUrl,
  };
}

function toYouTubeEmbedSource(originalUrl: string): StreamSource | null {
  const match = originalUrl.trim().match(YOUTUBE_ID_REGEX);
  if (!match) return null;

  return {
    type: "iframe-embed",
    embedUrl: buildYouTubeEmbedUrl(match[1]),
    originalUrl,
  };
}

function toGoogleMeetSource(originalUrl: string): StreamSource {
  const normalized = normalizeGoogleMeetUrl(originalUrl);
  return {
    type: "external-meeting",
    embedUrl: normalized,
    originalUrl: normalized,
    meetingPlatform: "google-meet",
  };
}

function toMicrosoftTeamsSource(originalUrl: string): StreamSource {
  const normalized = originalUrl.trim();
  if (isTeamsEmbedSupportedUrl(normalized)) {
    return {
      type: "iframe-embed",
      embedUrl: buildTeamsEmbedUrl(normalized),
      originalUrl: normalized,
      meetingPlatform: "microsoft-teams",
    };
  }

  return {
    type: "external-meeting",
    embedUrl: normalized,
    originalUrl: normalized,
    meetingPlatform: "microsoft-teams",
  };
}

export function parseStreamUrl(url: string, fallbackFileId?: string): StreamSource {
  const trimmed = url.trim();
  if (!trimmed) {
    return { type: "unknown", originalUrl: trimmed };
  }

  const iframeSrc = extractIframeSrc(trimmed);
  if (iframeSrc) {
    return parseStreamUrl(iframeSrc, fallbackFileId);
  }

  const youtubeSource = toYouTubeEmbedSource(trimmed);
  if (youtubeSource) return youtubeSource;

  if (isGoogleMeetStreamUrl(trimmed)) {
    return toGoogleMeetSource(trimmed);
  }

  if (isMicrosoftTeamsStreamUrl(trimmed)) {
    return toMicrosoftTeamsSource(trimmed);
  }

  const fileMatch = trimmed.match(GOOGLE_DRIVE_FILE_REGEX);
  if (fileMatch) {
    return toDriveFileSource(fileMatch[1], trimmed);
  }

  if (trimmed.match(GOOGLE_DRIVE_FOLDER_REGEX) && fallbackFileId) {
    return toDriveFileSource(fallbackFileId, trimmed);
  }

  const openMatch = trimmed.match(GOOGLE_DRIVE_OPEN_REGEX);
  if (openMatch) {
    return toDriveFileSource(openMatch[1], trimmed);
  }

  const ucMatch = trimmed.match(GOOGLE_DRIVE_UC_REGEX);
  if (ucMatch) {
    return toDriveFileSource(ucMatch[1], trimmed);
  }

  if (/\.m3u8(\?|$)/i.test(trimmed)) {
    return {
      type: "hls-stream",
      directUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(trimmed) || trimmed.startsWith("blob:")) {
    return {
      type: "direct-video",
      directUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return {
      type: "iframe-embed",
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  if (fallbackFileId) {
    return toDriveFileSource(fallbackFileId, trimmed);
  }

  return { type: "unknown", originalUrl: trimmed };
}
