import { getScheduleItemsDropdown } from "@/services/event.service";
import type { ScheduleItemRecord } from "@/services/event.service";
import type { AttendanceMode } from "@/types";

export async function ensureScheduleItemsForDays(
  dayIds: string[],
  scheduleItemsByDay: Record<string, ScheduleItemRecord[]>,
  attendanceByDay?: Record<string, AttendanceMode>,
): Promise<Record<string, ScheduleItemRecord[]>> {
  const next = { ...scheduleItemsByDay };
  const missingDayIds = dayIds.filter((dayId) => {
    if (next[dayId] === undefined) return true;
    const mode = attendanceByDay?.[dayId] ?? "physical";
    return mode === "physical" && next[dayId].length === 0;
  });

  await Promise.all(
    missingDayIds.map(async (dayId) => {
      try {
        next[dayId] = await getScheduleItemsDropdown(dayId);
      } catch {
        next[dayId] = [];
      }
    }),
  );

  return next;
}

export function syncPhysicalDaySessions(
  selectedDayIds: string[],
  attendanceByDay: Record<string, AttendanceMode> | undefined,
  sessionsByDay: Record<string, string[]> | undefined,
  scheduleItemsByDay: Record<string, ScheduleItemRecord[]>,
  scheduleLoadingByDay: Record<string, boolean> = {},
): { sessionsByDay: Record<string, string[]>; changed: boolean } {
  const nextSessionsByDay = { ...(sessionsByDay ?? {}) };
  let changed = false;

  for (const dayId of selectedDayIds) {
    const mode = attendanceByDay?.[dayId] ?? "physical";
    if (mode !== "physical") continue;

    const dayItems = scheduleItemsByDay[dayId] ?? [];
    if (dayItems.length === 0 || scheduleLoadingByDay[dayId]) continue;

    const allIds = dayItems.map((item) => item.id);
    const selectedForDay = nextSessionsByDay[dayId] ?? [];
    const alreadyAllSelected =
      allIds.length === selectedForDay.length &&
      allIds.every((id) => selectedForDay.includes(id));

    if (!alreadyAllSelected) {
      nextSessionsByDay[dayId] = allIds;
      changed = true;
    }
  }

  return { sessionsByDay: nextSessionsByDay, changed };
}

export async function resolveRegistrationSessionsByDay(
  selectedDayIds: string[],
  attendanceByDay: Record<string, AttendanceMode> | undefined,
  sessionsByDay: Record<string, string[]> | undefined,
  scheduleItemsByDay: Record<string, ScheduleItemRecord[]>,
): Promise<{
  sessionsByDay: Record<string, string[]>;
  scheduleItemsByDay: Record<string, ScheduleItemRecord[]>;
}> {
  const loadedScheduleItems = await ensureScheduleItemsForDays(
    selectedDayIds,
    scheduleItemsByDay,
    attendanceByDay,
  );
  const { sessionsByDay: syncedSessionsByDay } = syncPhysicalDaySessions(
    selectedDayIds,
    attendanceByDay,
    sessionsByDay,
    loadedScheduleItems,
  );

  return {
    sessionsByDay: syncedSessionsByDay,
    scheduleItemsByDay: loadedScheduleItems,
  };
}
