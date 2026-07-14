import { isIcasEventName } from "@/lib/icas-conference";

export interface UpcomingEventDay {
  day: number;
  suffix: string;
}

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function parseEventDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const ICAS_HOME_LEAD_DAY = 19;

function prependIcasLeadDay(days: UpcomingEventDay[]): UpcomingEventDay[] {
  if (days.length === 0 || days.some((d) => d.day === ICAS_HOME_LEAD_DAY)) return days;
  if (days[0].day > ICAS_HOME_LEAD_DAY) {
    return [{ day: ICAS_HOME_LEAD_DAY, suffix: getOrdinalSuffix(ICAS_HOME_LEAD_DAY) }, ...days];
  }
  return days;
}

export function formatEventDateRange(start: string, end?: string): string {
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end ?? start);
  if (!startDate || !endDate) return "";

  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.toLocaleDateString("en-IN", { month: "long" });
  const endMonth = endDate.toLocaleDateString("en-IN", { month: "long" });
  const year = endDate.getFullYear();

  const startLabel = `${startDay}${getOrdinalSuffix(startDay)}`;
  const endLabel = `${endDay}${getOrdinalSuffix(endDay)}`;

  if (startMonth === endMonth && startDate.getFullYear() === endDate.getFullYear()) {
    if (startDay === endDay) return `${startLabel} ${startMonth} ${year}`;
    return `${startLabel} – ${endLabel} ${startMonth} ${year}`;
  }

  return `${startLabel} ${startMonth} – ${endLabel} ${endMonth} ${year}`;
}

export function getUpcomingEventDays(start: string, end?: string): UpcomingEventDay[] {
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end ?? start);
  if (!startDate || !endDate) return [];

  const days: UpcomingEventDay[] = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const last = new Date(endDate);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    const day = current.getDate();
    days.push({ day, suffix: getOrdinalSuffix(day) });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/** Home page dates — ICAS events prepend 19th before API range (e.g. 19, 20, 21). */
export function getHomeEventDays(
  eventName: string | undefined,
  start: string,
  end?: string,
): UpcomingEventDay[] {
  const days = getUpcomingEventDays(start, end);
  if (eventName && isIcasEventName(eventName)) {
    return prependIcasLeadDay(days);
  }
  return days;
}

export function formatHomeEventDateRange(
  eventName: string | undefined,
  start: string,
  end?: string,
): string {
  if (eventName && isIcasEventName(eventName)) {
    const days = prependIcasLeadDay(getUpcomingEventDays(start, end));
    if (days.length === 0) return formatEventDateRange(start, end);

    const endDate = parseEventDate(end ?? start);
    if (!endDate) return formatEventDateRange(start, end);

    const month = endDate.toLocaleDateString("en-IN", { month: "long" });
    const year = endDate.getFullYear();
    const first = days[0];
    const last = days[days.length - 1];
    const startLabel = `${first.day}${first.suffix}`;
    const endLabel = `${last.day}${last.suffix}`;
    if (first.day === last.day) return `${startLabel} ${month} ${year}`;
    return `${startLabel} – ${endLabel} ${month} ${year}`;
  }
  return formatEventDateRange(start, end);
}

export function getUpcomingEventMonthLabel(start: string, end?: string): string {
  const endDate = parseEventDate(end ?? start);
  if (!endDate) return "";
  return endDate.toLocaleDateString("en-IN", { month: "long" });
}

export function getEventDayCount(start: string, end?: string): number {
  return getUpcomingEventDays(start, end).length;
}

const DAY_COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
] as const;

export function formatEventDurationAdjective(count: number): string {
  if (count > 0 && count < DAY_COUNT_WORDS.length) {
    return `${DAY_COUNT_WORDS[count]}-day`;
  }
  return `${count}-day`;
}

export function formatEventDurationNoun(count: number): string {
  if (count === 1) return "One day";
  if (count > 0 && count < DAY_COUNT_WORDS.length) {
    return `${DAY_COUNT_WORDS[count].charAt(0).toUpperCase()}${DAY_COUNT_WORDS[count].slice(1)} days`;
  }
  return `${count} days`;
}

export function formatEventDateRangeCompact(start: string, end?: string): string {
  const startDate = parseEventDate(start);
  const endDate = parseEventDate(end ?? start);
  if (!startDate || !endDate) return "";

  const format = (date: Date) =>
    date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (startDate.toDateString() === endDate.toDateString()) {
    return format(startDate);
  }

  return `${format(startDate)} – ${format(endDate)}`;
}

export interface EventCountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isPast: boolean;
}

export function getEventCountdown(targetIso: string, now = Date.now()): EventCountdownParts {
  const target = parseEventDate(targetIso);
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const totalMs = target.getTime() - now;
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isPast: true };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalMs, isPast: false };
}
