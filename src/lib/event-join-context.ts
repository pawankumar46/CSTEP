import {
  getEventDaysDropdown,
  getScheduleItemsDropdown,
  type EventDayDropdownOption,
  type ScheduleItemRecord,
} from "@/services/event.service";

const IST_TIME_ZONE = "Asia/Kolkata";

export interface EventJoinContext {
  dayId?: number;
  sessionId?: number;
}

function todayIsoInIst(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function nowMinutesInIst(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function clockMinutesFromApi(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const iso = trimmed.match(/T(\d{2}):(\d{2})/);
  if (iso) return Number(iso[1]) * 60 + Number(iso[2]);
  const clock = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!clock) return null;
  return Number(clock[1]) * 60 + Number(clock[2]);
}

function toNumericId(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function isSessionItem(item: ScheduleItemRecord): boolean {
  return item.itemType.toUpperCase() === "SESSION";
}

function isRunningAt(
  item: ScheduleItemRecord,
  nowMinutes: number,
): boolean {
  const start = clockMinutesFromApi(item.startTime);
  const end = clockMinutesFromApi(item.endTime);
  if (start == null || end == null) return false;
  if (end > start) return nowMinutes >= start && nowMinutes < end;
  return nowMinutes >= start || nowMinutes < end;
}

function pickRunningSession(
  items: ScheduleItemRecord[],
  nowMinutes: number,
): ScheduleItemRecord | undefined {
  const running = items.filter((item) => isRunningAt(item, nowMinutes));
  if (running.length === 0) return undefined;
  const sessions = running.filter(isSessionItem);
  const pool = sessions.length > 0 ? sessions : running;
  return [...pool].sort((a, b) => {
    const aStart = clockMinutesFromApi(a.startTime) ?? 0;
    const bStart = clockMinutesFromApi(b.startTime) ?? 0;
    return bStart - aStart;
  })[0];
}

function pickCurrentEventDay(
  days: EventDayDropdownOption[],
  todayIso: string,
): EventDayDropdownOption | undefined {
  const exact = days.find((day) => day.date.slice(0, 10) === todayIso);
  if (exact) return exact;

  const started = days
    .filter((day) => day.date.slice(0, 10) <= todayIso)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (started[0]) return started[0];

  return [...days].sort((a, b) => a.date.localeCompare(b.date))[0];
}

/** Resolve the event day and currently running schedule item for join payloads. */
export async function resolveEventJoinContext(
  eventId: string,
  now = new Date(),
): Promise<EventJoinContext> {
  try {
    const days = await getEventDaysDropdown(eventId);
    const day = pickCurrentEventDay(days, todayIsoInIst(now));
    const dayId = day ? toNumericId(day.id) : undefined;
    if (!day || dayId == null) return {};

    const items = await getScheduleItemsDropdown(day.id);
    const running = pickRunningSession(items, nowMinutesInIst(now));
    return {
      dayId,
      sessionId: running ? toNumericId(running.id) : undefined,
    };
  } catch {
    return {};
  }
}
