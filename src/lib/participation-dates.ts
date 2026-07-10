import type { Event } from "@/types";

export interface ParticipationDateOption {
  value: string;
  label: string;
}

function toIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function formatDayLabel(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("en-IN", { month: "long" });
  return `${day}${getOrdinalSuffix(day)} ${month}`;
}

function getUniqueCalendarDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function formatIsoDateLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return formatDayLabel(parsed);
}

export interface EventDayDateSource {
  date: string;
  label?: string;
}

export function buildParticipationDateOptionsFromEventDays(
  days: EventDayDateSource[],
  includeAllDays = true,
): ParticipationDateOption[] {
  const sorted = [...days]
    .filter((day) => Boolean(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dayOptions = sorted.map((day) => ({
    value: day.date,
    label: day.label?.trim() ? day.label.trim() : formatIsoDateLabel(day.date),
  }));

  if (includeAllDays && dayOptions.length > 1) {
    const allDaysLabel = dayOptions.map((option) => option.label).join(" & ");
    const multiDayHeading = dayOptions.length === 2 ? "Both Days" : "All Days";

    dayOptions.push({
      value: "both_days",
      label: `${multiDayHeading} (${allDaysLabel})`,
    });
  }

  return dayOptions;
}

export function getParticipationEventRangeFromDays(
  days: EventDayDateSource[],
): Pick<Event, "date" | "endDate"> | null {
  const sorted = [...days]
    .filter((day) => Boolean(day.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return null;

  return {
    date: sorted[0].date,
    endDate: sorted[sorted.length - 1].date,
  };
}

export function getParticipationDateOptions(
  event?: Pick<Event, "date" | "endDate"> | null,
): ParticipationDateOption[] {
  if (!event?.date) return [];

  const start = new Date(event.date);
  const end = new Date(event.endDate ?? event.date);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }

  const days = getUniqueCalendarDays(start, end);
  const dayOptions = days.map((day) => ({
    value: toIsoDateOnly(day),
    label: formatDayLabel(day),
  }));

  if (dayOptions.length > 1) {
    const allDaysLabel = dayOptions.map((option) => option.label).join(" & ");
    const multiDayHeading = dayOptions.length === 2 ? "Both Days" : "All Days";

    dayOptions.push({
      value: "both_days",
      label: `${multiDayHeading} (${allDaysLabel})`,
    });
  }

  return dayOptions;
}

export function getDefaultParticipationDate(
  event?: Pick<Event, "date" | "endDate"> | null,
): string {
  const options = getParticipationDateOptions(event);
  if (options.length === 0) return "both_days";
  if (options.length === 1) return options[0].value;
  return options.find((option) => option.value === "both_days")?.value ?? options[0].value;
}

export function formatParticipationDatesFaqAnswer(
  event?: Pick<Event, "date" | "endDate"> | null,
): string {
  const dayOptions = getParticipationDateOptions(event).filter(
    (option) => option.value !== "both_days",
  );

  if (dayOptions.length === 0) {
    return "Participation date options are shown during registration based on the event schedule.";
  }

  if (dayOptions.length === 1) {
    return `The event takes place on ${dayOptions[0].label}. Select your preferred date during registration.`;
  }

  const dayOrdinals = dayOptions.map((option) => option.label.split(" ")[0]);
  const lastOrdinal = dayOrdinals.pop()!;
  const ordinalList =
    dayOrdinals.length > 0 ? `${dayOrdinals.join(", ")}, or ${lastOrdinal}` : lastOrdinal;
  const allDaysLabel = dayOptions.length === 2 ? "both days" : "all days";

  return `You can choose to participate on the ${ordinalList}, or ${allDaysLabel}. Select your preferred date during registration.`;
}

export function getParticipationDateLabel(
  value: string,
  event?: Pick<Event, "date" | "endDate"> | null,
): string {
  const options = getParticipationDateOptions(event);
  const match = options.find((option) => option.value === value);
  if (match) return match.label;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDayLabel(parsed);
    }
  }

  return value.replace(/_/g, " ");
}

export function getEventDayDates(event?: Pick<Event, "date" | "endDate"> | null): string[] {
  return getParticipationDateOptions(event)
    .filter((option) => option.value !== "both_days")
    .map((option) => option.value);
}

export function resolveParticipationDatesForApi(
  participationDate: string,
  event?: Pick<Event, "date" | "endDate"> | null,
): string[] {
  if (participationDate === "both_days") {
    return getEventDayDates(event);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(participationDate)) {
    return [participationDate];
  }

  return participationDate ? [participationDate] : getEventDayDates(event);
}
