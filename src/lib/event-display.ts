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

export interface UpcomingEventDay {
  day: number;
  suffix: string;
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
