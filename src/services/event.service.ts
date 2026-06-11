import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  extractEventList,
  mapApiEventToEvent,
  mapApiUpcomingEvent,
  toCreateEventPayload,
  toUpdateEventPayload,
} from "@/lib/event-mappers";
import type { CreateEventPayload, Event, UpcomingEvent, UpdateEventPayload } from "@/types";

export const getUpcomingEvents = async (): Promise<UpcomingEvent[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/upcoming/");
    return extractEventList(data).map(mapApiUpcomingEvent);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEvents = async (): Promise<Event[]> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/");
    return extractEventList(data).map(mapApiEventToEvent);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getEventById = async (id: string): Promise<Event | null> => {
  try {
    const { data } = await apiClient.get<Record<string, unknown>>(`/events/${id}/`);
    return mapApiEventToEvent(data);
  } catch {
    return null;
  }
};

export const createEvent = async (payload: CreateEventPayload): Promise<Event> => {
  try {
    const { data } = await apiClient.post<Record<string, unknown>>(
      "/events/",
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
      `/events/${id}/`,
      toUpdateEventPayload(payload)
    );
    return mapApiEventToEvent(response);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${id}/`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};
