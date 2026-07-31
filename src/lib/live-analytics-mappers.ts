import type { LiveAnalyticsModeSeries, LiveAnalyticsSnapshot } from "@/lib/live-analytics-api-contract";
import type { DistributionDataPoint, StreamingSummary } from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapShareRows(raw: unknown): DistributionDataPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: DistributionDataPoint[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      points.push({ name: item, value: 0 });
      continue;
    }
    const row = asRecord(item);
    if (!row) continue;
    const name =
      pickString(row.label)
      ?? pickString(row.name)
      ?? pickString(row.state)
      ?? pickString(row.country)
      ?? pickString(row.session)
      ?? pickString(row.title)
      ?? pickString(row.session_name)
      ?? pickString(row.schedule_item_title);
    const value =
      pickNumber(row.count)
      ?? pickNumber(row.value)
      ?? pickNumber(row.max)
      ?? pickNumber(row.max_count)
      ?? pickNumber(row.peak)
      ?? pickNumber(row.participants)
      ?? 0;
    if (!name) continue;
    points.push({ name, value });
  }
  return points;
}

function mapCountRecord(raw: unknown): DistributionDataPoint[] {
  const record = asRecord(raw);
  if (!record) return [];
  return Object.entries(record)
    .map(([name, value]) => ({ name, value: pickNumber(value) ?? 0 }))
    .filter((row) => row.name && row.value > 0)
    .sort((a, b) => b.value - a.value);
}

function mapDistribution(raw: unknown): DistributionDataPoint[] {
  const fromRows = mapShareRows(raw);
  if (fromRows.length > 0) return fromRows;
  return mapCountRecord(raw);
}

function emptyModeSeries(): LiveAnalyticsModeSeries {
  return { all: [], physical: [], virtual: [] };
}

function mapModeSeries(raw: unknown): LiveAnalyticsModeSeries {
  const root = asRecord(raw);
  if (!root) {
    const flat = mapDistribution(raw);
    return { all: flat, physical: [], virtual: [] };
  }

  const all = mapDistribution(root.all ?? root.total);
  const physical = mapDistribution(root.physical ?? root.PHYSICAL);
  const virtual = mapDistribution(root.virtual ?? root.VIRTUAL);

  // Flat list without mode nesting → treat as "all"
  if (all.length === 0 && physical.length === 0 && virtual.length === 0) {
    const flat = mapDistribution(raw);
    return { all: flat, physical: [], virtual: [] };
  }

  return {
    all: all.length > 0 ? all : [...physical, ...virtual],
    physical,
    virtual,
  };
}

function firstDefined(...values: unknown[]): unknown {
  for (const value of values) {
    if (value != null) return value;
  }
  return undefined;
}

function mapStreamingPartial(root: Record<string, unknown>): Partial<StreamingSummary> | null {
  const streaming = asRecord(root.streaming) ?? asRecord(root.streaming_summary) ?? root;
  const currentlyWatching =
    pickNumber(streaming.currently_watching)
    ?? pickNumber(streaming.currently_watching_count);
  const uniqueViewers =
    pickNumber(streaming.unique_viewers)
    ?? pickNumber(streaming.unique_viewers_count);
  const broadcastSessions =
    pickNumber(streaming.broadcast_sessions)
    ?? pickNumber(streaming.broadcast_sessions_count);
  const peakConcurrentViewers =
    pickNumber(streaming.peak_concurrent_viewers)
    ?? pickNumber(streaming.peak_concurrent_viewers_count);

  if (
    currentlyWatching == null
    && uniqueViewers == null
    && broadcastSessions == null
    && peakConcurrentViewers == null
  ) {
    return null;
  }

  return {
    ...(currentlyWatching != null ? { currentlyWatching } : {}),
    ...(uniqueViewers != null ? { uniqueViewers } : {}),
    ...(broadcastSessions != null ? { broadcastSessions } : {}),
    ...(peakConcurrentViewers != null ? { peakConcurrentViewers } : {}),
    ...(pickNumber(streaming.avg_watch_time_seconds) != null
      ? { avgWatchTimeSeconds: pickNumber(streaming.avg_watch_time_seconds)! }
      : {}),
    ...(pickString(streaming.avg_watch_time_display)
      ? { avgWatchTimeDisplay: pickString(streaming.avg_watch_time_display)! }
      : {}),
    ...(pickNumber(streaming.total_watch_time_seconds) != null
      ? { totalWatchTimeSeconds: pickNumber(streaming.total_watch_time_seconds)! }
      : {}),
    ...(pickString(streaming.total_watch_time_display)
      ? { totalWatchTimeDisplay: pickString(streaming.total_watch_time_display)! }
      : {}),
    ...(typeof streaming.live_broadcast === "boolean"
      ? { liveBroadcast: streaming.live_broadcast }
      : {}),
  };
}

/**
 * Map a live analytics WebSocket JSON payload into UI-ready series.
 * Accepts several likely BE key names until the contract is finalized.
 */
export function mapLiveAnalyticsPayload(raw: unknown): LiveAnalyticsSnapshot {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;

  const statewiseRaw = firstDefined(
    data.statewise_login,
    data.statewise_logins,
    data.logins_by_state,
    data.by_state,
    data.state_login,
  );
  const countrywiseRaw = firstDefined(
    data.countrywise_login,
    data.countrywise_logins,
    data.logins_by_country,
    data.by_country,
    data.country_login,
    asRecord(data.countrywise_login)?.virtual,
  );
  const sessionMaxRaw = firstDefined(
    data.session_max_virtual,
    data.session_wise_max_virtual,
    data.session_max_virtual_participants,
    data.by_session_max_virtual,
    data.max_virtual_by_session,
    data.session_wise_max_virtual_participant_count,
  );

  const countryRoot = asRecord(countrywiseRaw);
  const countryVirtual = countryRoot
    ? mapDistribution(countryRoot.virtual ?? countryRoot.all ?? countrywiseRaw)
    : mapDistribution(countrywiseRaw);

  return {
    receivedAt: new Date().toISOString(),
    eventId:
      pickString(data.event_id)
      ?? pickString(data.eventId)
      ?? (pickNumber(data.event) != null ? String(pickNumber(data.event)) : undefined),
    statewiseLogin: mapModeSeries(statewiseRaw),
    countrywiseLoginVirtual: countryVirtual,
    sessionMaxVirtual: mapDistribution(sessionMaxRaw),
    streamingSummary: mapStreamingPartial(data),
    raw,
  };
}

export function emptyLiveAnalyticsSnapshot(): LiveAnalyticsSnapshot {
  return {
    receivedAt: new Date().toISOString(),
    statewiseLogin: emptyModeSeries(),
    countrywiseLoginVirtual: [],
    sessionMaxVirtual: [],
    streamingSummary: null,
    raw: null,
  };
}
