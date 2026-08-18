import type { EventRecording, EventRecordingsPage } from "@/types";

function normalizeRecordingFileUrl(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return raw;
  }
}

function normalizeOptionalUrl(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  return raw ? raw : null;
}

export function mapApiEventRecording(raw: unknown): EventRecording {
  const row =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    id: String(row.id ?? ""),
    sessionId: String(row.session ?? ""),
    date: String(row.date ?? ""),
    sessionTitle: String(row.session_title ?? "Untitled session"),
    startedAt: String(row.started_at ?? ""),
    endedAt: row.ended_at == null ? null : String(row.ended_at),
    file: normalizeRecordingFileUrl(row.file),
    fileUrl: normalizeOptionalUrl(row.file_url),
    status: String(row.status ?? ""),
  };
}

export function mapApiEventRecordingsPage(
  raw: unknown,
  fallbackPage = 1,
): EventRecordingsPage {
  const root =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const results = Array.isArray(root.results) ? root.results : [];
  const rows = results.map(mapApiEventRecording);
  const total = Number(root.count ?? rows.length);
  const page = Number(root.current_page ?? fallbackPage);
  const totalPages = Number(root.total_pages ?? Math.max(1, Math.ceil(total / 10)));

  return {
    rows,
    page,
    total,
    totalPages,
    hasNext: Boolean(root.next) || page < totalPages,
    hasPrevious: Boolean(root.previous) || page > 1,
  };
}
