export type StreamSourceType =
  | "google-drive-file"
  | "direct-video"
  | "hls-stream"
  | "iframe-embed"
  | "unknown";

export interface StreamSource {
  type: StreamSourceType;
  fileId?: string;
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
}

const GOOGLE_DRIVE_FILE_REGEX = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_FOLDER_REGEX = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_OPEN_REGEX = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
const GOOGLE_DRIVE_UC_REGEX = /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/;
const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function isGoogleDriveStreamUrl(url: string): boolean {
  return /drive\.google\.com/i.test(url.trim());
}

export function isYouTubeStreamUrl(url: string): boolean {
  return YOUTUBE_ID_REGEX.test(url.trim());
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

export function parseStreamUrl(url: string, fallbackFileId?: string): StreamSource {
  const trimmed = url.trim();
  if (!trimmed) {
    return { type: "unknown", originalUrl: trimmed };
  }

  const youtubeSource = toYouTubeEmbedSource(trimmed);
  if (youtubeSource) return youtubeSource;

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
