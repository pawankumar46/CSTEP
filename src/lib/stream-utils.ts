export type StreamSourceType = "google-drive-file" | "direct-video" | "hls-stream" | "unknown";

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

export function parseStreamUrl(url: string, fallbackFileId?: string): StreamSource {
  const trimmed = url.trim();
  if (!trimmed) {
    return { type: "unknown", originalUrl: trimmed };
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

  if (fallbackFileId) {
    return toDriveFileSource(fallbackFileId, trimmed);
  }

  return { type: "unknown", originalUrl: trimmed };
}
