export type TimelineItemType = "session" | "break";
export type ScheduleItemType =
  | "SESSION"
  | "BREAKFAST_BREAK"
  | "TEA_BREAK"
  | "LUNCH_BREAK"
  | "DINNER_BREAK"
  | "NETWORKING_BREAK"
  | "CUSTOM_BREAK";

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  sessionType?: ScheduleItemType;
  label: string;
  start: number;
  duration: number;
}

export type ScheduleByDate = Record<string, TimelineItem[]>;

export type ScheduleByEvent = Record<string, ScheduleByDate>;

export const SCHEDULER_DAY_START_MINUTES = 8 * 60;
export const SCHEDULER_DAY_END_MINUTES = 21 * 60;
export const SCHEDULER_PX_PER_HOUR = 160;
export const SCHEDULER_PX_PER_MINUTE = SCHEDULER_PX_PER_HOUR / 60;
export const SCHEDULER_SNAP_MINUTES = 5;
export const SCHEDULER_MIN_BLOCK_PX = 56;
export const SCHEDULER_DURATION_PRESETS = [15, 30, 45, 60, 90] as const;
export const SCHEDULER_TIMELINE_EDGE_PADDING_PX = 44;

export const SCHEDULER_TOTAL_HOURS =
  (SCHEDULER_DAY_END_MINUTES - SCHEDULER_DAY_START_MINUTES) / 60;

export const SCHEDULER_TIMELINE_WIDTH_PX =
  SCHEDULER_TOTAL_HOURS * SCHEDULER_PX_PER_HOUR + SCHEDULER_TIMELINE_EDGE_PADDING_PX * 2;

export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeInputToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return SCHEDULER_DAY_START_MINUTES;
  return h * 60 + m;
}

export type TwelveHourPeriod = "AM" | "PM";

export interface TwelveHourParts {
  hour12: number;
  minute: number;
  period: TwelveHourPeriod;
}

export function timeInputTo12HourParts(value: string): TwelveHourParts {
  const totalMinutes = timeInputToMinutes(value);
  const h24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return {
    hour12: h24 % 12 || 12,
    minute,
    period: h24 >= 12 ? "PM" : "AM",
  };
}

export function twelveHourPartsToTimeInput({
  hour12,
  minute,
  period,
}: TwelveHourParts): string {
  let h24 = hour12 % 12;
  if (period === "PM") h24 += 12;
  return minutesToTimeInput(h24 * 60 + minute);
}

export function getSchedulerHour12OptionsForPeriod(period: TwelveHourPeriod): number[] {
  const hours: number[] = [];

  for (let minutes = SCHEDULER_DAY_START_MINUTES; minutes < SCHEDULER_DAY_END_MINUTES; minutes += 60) {
    const parts = timeInputTo12HourParts(minutesToTimeInput(minutes));
    if (parts.period === period && !hours.includes(parts.hour12)) {
      hours.push(parts.hour12);
    }
  }

  if (period === "PM") {
    return hours.sort((a, b) => (a === 12 ? 0 : a + 12) - (b === 12 ? 0 : b + 12));
  }

  return hours.sort((a, b) => a - b);
}

export function formatSchedulerWindowLabel(): string {
  return `${formatMinutesLabel(SCHEDULER_DAY_START_MINUTES)} – ${formatMinutesLabel(SCHEDULER_DAY_END_MINUTES)}`;
}

export function getSchedulerDefaultStartTime(): string {
  return minutesToTimeInput(SCHEDULER_DAY_START_MINUTES);
}

export const SCHEDULER_MINUTE_OPTIONS = Array.from(
  { length: 60 / SCHEDULER_SNAP_MINUTES },
  (_, index) => index * SCHEDULER_SNAP_MINUTES,
);

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SCHEDULER_SNAP_MINUTES) * SCHEDULER_SNAP_MINUTES;
}

export function minutesToLeftPx(minutes: number): number {
  return (
    (minutes - SCHEDULER_DAY_START_MINUTES) * SCHEDULER_PX_PER_MINUTE
    + SCHEDULER_TIMELINE_EDGE_PADDING_PX
  );
}

export function durationToWidthPx(duration: number): number {
  return Math.max(duration * SCHEDULER_PX_PER_MINUTE, SCHEDULER_MIN_BLOCK_PX);
}

export function gapToWidthPx(duration: number): number {
  return duration * SCHEDULER_PX_PER_MINUTE;
}

export function pxToMinutes(px: number): number {
  return (
    (px - SCHEDULER_TIMELINE_EDGE_PADDING_PX) / SCHEDULER_PX_PER_MINUTE
    + SCHEDULER_DAY_START_MINUTES
  );
}

export function formatMinutesLabel(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return m === 0 ? `${h12}:00 ${period}` : `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(start: number, duration: number): string {
  return `${formatMinutesLabel(start)}–${formatMinutesLabel(start + duration)}`;
}

export function formatMinutesLabelShort(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  if (m === 0) return `${h12}${period}`;
  return `${h12}:${String(m).padStart(2, "0")}${period}`;
}

export function formatTimeRangeShort(start: number, duration: number): string {
  return `${formatMinutesLabelShort(start)}–${formatMinutesLabelShort(start + duration)}`;
}

export function isCompactBlockWidth(widthPx: number): boolean {
  return widthPx < 100;
}

export function isMediumBlockWidth(widthPx: number): boolean {
  return widthPx >= 100 && widthPx < 160;
}

export function itemEnd(item: Pick<TimelineItem, "start" | "duration">): number {
  return item.start + item.duration;
}

export function itemsOverlap(
  a: Pick<TimelineItem, "start" | "duration">,
  b: Pick<TimelineItem, "start" | "duration">,
): boolean {
  return a.start < itemEnd(b) && b.start < itemEnd(a);
}

export function findOverlapConflict(
  items: TimelineItem[],
  candidate: Pick<TimelineItem, "id" | "start" | "duration">,
): TimelineItem | null {
  for (const item of items) {
    if (item.id === candidate.id) continue;
    if (itemsOverlap(candidate, item)) return item;
  }
  return null;
}

export function clampStartToDay(start: number, duration: number): number {
  const min = SCHEDULER_DAY_START_MINUTES;
  const max = SCHEDULER_DAY_END_MINUTES - duration;
  return Math.min(Math.max(start, min), max);
}

export function generateTimelineItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getHourMarkers(): number[] {
  const markers: number[] = [];
  for (let m = SCHEDULER_DAY_START_MINUTES; m <= SCHEDULER_DAY_END_MINUTES; m += 60) {
    markers.push(m);
  }
  return markers;
}

export function currentMinutesSinceMidnight(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export const MAX_EVENT_SCHEDULE_DAYS = 3;

export interface EventScheduleDay {
  value: string;
  label: string;
  shortLabel: string;
  dayId?: string;
}

export const SCHEDULE_ITEM_TYPE_OPTIONS: { value: ScheduleItemType; label: string }[] = [
  { value: "SESSION", label: "Session" },
  { value: "BREAKFAST_BREAK", label: "Breakfast Break" },
  { value: "TEA_BREAK", label: "Tea Break" },
  { value: "LUNCH_BREAK", label: "Lunch Break" },
  { value: "DINNER_BREAK", label: "Dinner Break" },
  { value: "NETWORKING_BREAK", label: "Networking Break" },
  { value: "CUSTOM_BREAK", label: "Custom Break" },
];

export function scheduleTypeToTimelineType(itemType: ScheduleItemType): TimelineItemType {
  return itemType === "SESSION" ? "session" : "break";
}

export function toIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getEventScheduleDays(
  startIso?: string | null,
  endIso?: string | null,
): EventScheduleDay[] {
  if (!startIso) return [];

  const start = new Date(startIso);
  const end = new Date(endIso ?? startIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (cursor <= last && days.length < MAX_EVENT_SCHEDULE_DAYS) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  if (days.length === 0) {
    days.push(new Date(start));
  }

  return days.map((day, index) => {
    const shortLabel = day.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    return {
      value: toIsoDateOnly(day),
      label: `Day ${index + 1} — ${shortLabel}`,
      shortLabel,
    };
  });
}
