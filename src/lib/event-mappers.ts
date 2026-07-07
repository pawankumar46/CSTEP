import type {
  CreateEventPayload,
  Event,
  EventScheduleType,
  EventRegistrationSummary,
  EventStatus,
  UpcomingEvent,
  UpdateEventPayload,
} from "@/types";

const DEFAULT_EVENT_IMAGE =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

export function toCreateEventPayload(data: CreateEventPayload) {
  return {
    title: data.title,
    description: data.description,
    scheduled_start: toIsoDateTime(data.scheduledStart),
    scheduled_end: toIsoDateTime(data.scheduledEnd),
    video_muted_by_default: data.videoMutedByDefault,
    pause_continue_enabled: data.pauseContinueEnabled,
    schedule_type: data.scheduleType,
  };
}

export function toIsoDateTime(localValue: string): string {
  if (!localValue) return "";
  return new Date(localValue).toISOString();
}

export function toLocalDateTimeInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toUpdateEventPayload(data: UpdateEventPayload) {
  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload.title = data.title;
  if (data.description !== undefined) payload.description = data.description;
  if (data.scheduledStart) payload.scheduled_start = toIsoDateTime(data.scheduledStart);
  if (data.scheduledEnd) payload.scheduled_end = toIsoDateTime(data.scheduledEnd);
  if (data.videoMutedByDefault !== undefined) payload.video_muted_by_default = data.videoMutedByDefault;
  if (data.pauseContinueEnabled !== undefined) payload.pause_continue_enabled = data.pauseContinueEnabled;
  if (data.scheduleType !== undefined) payload.schedule_type = data.scheduleType;

  return payload;
}

export function extractEventList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown[] }).results)) {
    return (data as { results: Record<string, unknown>[] }).results;
  }
  return [];
}

function mapEventStatus(raw: Record<string, unknown>): EventStatus {
  const status = String(raw.status ?? "draft").toLowerCase();
  const valid: EventStatus[] = ["draft", "published", "live", "completed", "cancelled"];
  return valid.includes(status as EventStatus) ? (status as EventStatus) : "draft";
}

function mapEventRegistrationSummary(raw: unknown): EventRegistrationSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const summary = raw as Record<string, unknown>;

  return {
    totalRegisteredUsers: Number(summary.total_registered_users ?? 0),
    participantsAttended: Number(summary.participants_attended ?? 0),
    participantsAccepted: Number(summary.participants_accepted ?? 0),
    participantsRejected: Number(summary.participants_rejected ?? 0),
    participantsPending: Number(summary.participants_pending ?? 0),
    participantsHeld: Number(summary.participants_held ?? 0),
  };
}

export function mapApiUpcomingEvent(raw: Record<string, unknown>): UpcomingEvent {
  const base = mapApiEventToEvent(raw);
  const summary = mapEventRegistrationSummary(raw.summary);

  return {
    ...base,
    isRegistered: Boolean(raw.is_registered ?? raw.isRegistered),
    registeredCount: summary?.totalRegisteredUsers ?? base.registeredCount,
    summary,
  };
}

export function mapApiEventToEvent(raw: Record<string, unknown>): Event {
  const now = new Date().toISOString();
  const scheduleTypeRaw = String(raw.schedule_type ?? raw.scheduleType ?? "").toUpperCase();
  const scheduleType =
    scheduleTypeRaw === "WHOLE_DAY" || scheduleTypeRaw === "MULTI_SESSION"
      ? (scheduleTypeRaw as EventScheduleType)
      : undefined;

  return {
    id: String(raw.id ?? raw.pk ?? ""),
    name: String(raw.title ?? raw.name ?? "Untitled Event"),
    description: String(raw.description ?? ""),
    date: String(raw.scheduled_start ?? raw.date ?? now),
    endDate: raw.scheduled_end ? String(raw.scheduled_end) : undefined,
    status: mapEventStatus(raw),
    location: String(raw.location ?? "Hybrid"),
    maxParticipants: Number(raw.max_participants ?? raw.maxParticipants ?? 1000),
    registeredCount: Number(raw.registered_count ?? raw.registeredCount ?? 0),
    imageUrl: String(raw.image_url ?? raw.imageUrl ?? DEFAULT_EVENT_IMAGE),
    videoUrl: raw.video_url ? String(raw.video_url) : undefined,
    createdBy: String(raw.created_by ?? raw.createdBy ?? ""),
    createdAt: String(raw.created_at ?? raw.createdAt ?? now),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? now),
    scheduleType,
  };
}
