import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import { mapApiAllowedAttendanceModes, mapAppAllowedAttendanceModesToApi } from "@/lib/registration-mappers";
import {
  extractEventList,
  mapApiEventDropdownOption,
  mapApiEventToEvent,
  mapApiUpcomingEvent,
  toCreateEventPayload,
  toUpdateEventPayload,
} from "@/lib/event-mappers";
import type {
  AttendanceMode,
  CreateEventPayload,
  Event,
  EventDropdownOption,
  EventListType,
  UpcomingEvent,
  UpdateEventPayload,
} from "@/types";

export interface EventDay {
  id: string;
  eventId: string;
  date: string;
  dayNumber: number;
  label: string;
  allowedAttendanceModes: AttendanceMode[];
}

export interface EventDayDropdownOption {
  id: string;
  dayNumber: number;
  date: string;
  label: string;
  allowedAttendanceModes: AttendanceMode[];
}

export interface CreateScheduleItemPayload {
  day: number;
  itemType: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface UpdateScheduleItemPayload {
  itemType: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleItemRecord {
  id: string;
  itemType: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  speakerName: string;
}

export const getUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/event/upcoming/");
    return extractEventList(data).map(mapApiUpcomingEvent);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Events for registration dropdown (Step 1). */
export const getEventDropdown = async (): Promise<EventDropdownOption[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/event/dropdown/");
    return extractEventList(data).map(mapApiEventDropdownOption);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEvents = async (type: EventListType = "upcoming"): Promise<Event[]> => {
  try {
    // The dedicated upcoming endpoint returns the assistance flags (allowed_*),
    // which the list endpoint omits — needed for prefilling the edit form.
    const { data } =
      type === "upcoming"
        ? await apiClient.get<unknown>("/events/event/upcoming/")
        : await apiClient.get<unknown>("/events/event/", { params: { type } });
    return extractEventList(data).map(mapApiEventToEvent);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** All events for admin dropdowns (no type filter). */
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/event/");
    return extractEventList(data).map(mapApiEventToEvent);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/events/event/${id}/`);
    return mapApiEventToEvent(data);
  } catch {
    return null;
  }
};

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  try {
    const { data } = await apiClient.post<Record<string, unknown>>(
      "/events/event/",
      toCreateEventPayload(payload)
    );
    return mapApiEventToEvent(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateEvent = async (id: string, payload: UpdateEventPayload): Promise<Event> => {
  try {
    const { data: response } = await apiClient.patch<Record<string, unknown>>(
      `/events/event/${id}/`,
      toUpdateEventPayload(payload)
    );
    return mapApiEventToEvent(response);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/event/${id}/`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventDays = async (eventId: string): Promise<EventDay[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/event-days/", {
      params: { event: eventId },
    });
    return extractEventList(data).map((item) => mapApiEventDay(item, eventId));
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventDaysDropdown = async (
  eventId: string,
): Promise<EventDayDropdownOption[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/event-days/dropdown/", {
      params: { event: eventId },
    });
    return extractEventList(data).map((item) => mapApiEventDayDropdownOption(item));
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateEventDayAttendanceModes = async (
  dayId: string,
  modes: AttendanceMode[],
): Promise<void> => {
  try {
    await apiClient.patch(`/events/event-days/${dayId}/`, {
      allowed_attendance_modes: mapAppAllowedAttendanceModesToApi(modes),
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

function mapApiEventDay(item: Record<string, unknown>, eventId: string): EventDay {
  return {
    id: String(item.id ?? ""),
    eventId: String(item.event ?? eventId),
    date: String(item.date ?? ""),
    dayNumber: Number(item.day_number ?? 0),
    label: String(item.label ?? ""),
    allowedAttendanceModes: mapApiAllowedAttendanceModes(item.allowed_attendance_modes),
  };
}

function mapApiEventDayDropdownOption(item: Record<string, unknown>): EventDayDropdownOption {
  const date = String(item.date ?? "");
  const label = String(item.label ?? "").trim();
  return {
    id: String(item.id ?? ""),
    dayNumber: Number(item.day_number ?? 0),
    date,
    label: label || date,
    allowedAttendanceModes: mapApiAllowedAttendanceModes(item.allowed_attendance_modes),
  };
}

export const createScheduleItem = async (
  payload: CreateScheduleItemPayload,
): Promise<void> => {
  try {
    await apiClient.post("/events/schedule-items/", {
      day: payload.day,
      item_type: payload.itemType,
      title: payload.title,
      description: payload.description,
      start_time: payload.startTime,
      end_time: payload.endTime,
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getScheduleItems = async (dayId: string | number): Promise<ScheduleItemRecord[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/schedule-items/", {
      params: { day: dayId },
    });
    return mapScheduleItemList(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getScheduleItemsDropdown = async (dayId: string | number): Promise<ScheduleItemRecord[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/schedule-items/dropdown/", {
      params: { day: dayId },
    });
    return mapScheduleItemList(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

function mapScheduleItemList(data: unknown): ScheduleItemRecord[] {
  return extractEventList(data).map((item) => ({
    id: String(item.id ?? ""),
    itemType: String(item.item_type ?? item.itemType ?? "SESSION"),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    startTime: String(item.start_time ?? item.startTime ?? "00:00:00"),
    endTime: String(item.end_time ?? item.endTime ?? "00:00:00"),
    speakerName: String(item.speaker_name ?? item.speakerName ?? ""),
  }));
}

export const deleteScheduleItem = async (scheduleItemId: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/schedule-items/${scheduleItemId}/`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const updateScheduleItem = async (
  scheduleItemId: string,
  payload: UpdateScheduleItemPayload,
): Promise<void> => {
  try {
    await apiClient.patch(`/events/schedule-items/${scheduleItemId}/`, {
      item_type: payload.itemType,
      title: payload.title,
      description: payload.description,
      start_time: payload.startTime,
      end_time: payload.endTime,
    });
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};
