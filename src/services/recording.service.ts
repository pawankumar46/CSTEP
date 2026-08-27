import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import {
  mapApiEventRecording,
  mapApiEventRecordingsPage,
} from "@/lib/recording-mappers";
import { delay } from "@/lib/utils";
import { mockRecordings } from "@/mock/recordings";
import type { EventRecording, EventRecordingsPage, Recording } from "@/types";

export const EVENT_RECORDINGS_PAGE_SIZE = 10;

/** Live: GET /events/recordings/?page=&page_size= */
export const getEventRecordings = async (
  page = 1,
  pageSize = EVENT_RECORDINGS_PAGE_SIZE,
): Promise<EventRecordingsPage> => {
  try {
    const { data } = await apiClient.get<unknown>("/events/recordings/", {
      params: { page, page_size: pageSize },
    });
    return mapApiEventRecordingsPage(data, page);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export type CreateEventRecordingInput =
  | { sessionId: string; sourceType: "url"; fileUrl: string }
  | { sessionId: string; sourceType: "file"; file: File };

function toRecordingFormData(
  input: Extract<CreateEventRecordingInput, { sourceType: "file" }>,
): FormData {
  const body = new FormData();
  body.append("session", input.sessionId);
  body.append("status", "READY");
  body.append("file", input.file);
  return body;
}

/** Live: POST /events/recordings/ — JSON URL or multipart file upload. */
export const createEventRecording = async (
  input: CreateEventRecordingInput,
): Promise<EventRecording> => {
  try {
    if (input.sourceType === "url") {
      const { data } = await apiClient.post<unknown>("/events/recordings/", {
        session: Number(input.sessionId),
        status: "READY",
        file_url: input.fileUrl,
      });
      return mapApiEventRecording(data);
    }

    const { data } = await apiClient.post<unknown>(
      "/events/recordings/",
      toRecordingFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10 * 60 * 1000,
      },
    );
    return mapApiEventRecording(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: PATCH /events/recordings/:id/ — JSON URL or multipart file upload. */
export const updateEventRecording = async (
  recordingId: string,
  input: CreateEventRecordingInput,
): Promise<EventRecording> => {
  try {
    const endpoint = `/events/recordings/${recordingId}/`;
    if (input.sourceType === "url") {
      const { data } = await apiClient.patch<unknown>(endpoint, {
        session: Number(input.sessionId),
        status: "READY",
        file_url: input.fileUrl,
      });
      return mapApiEventRecording(data);
    }

    const { data } = await apiClient.patch<unknown>(
      endpoint,
      toRecordingFormData(input),
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10 * 60 * 1000,
      },
    );
    return mapApiEventRecording(data);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

/** Live: DELETE /events/recordings/:id/ */
export const deleteEventRecording = async (
  recordingId: string,
): Promise<void> => {
  try {
    await apiClient.delete(`/events/recordings/${recordingId}/`);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};

export const getRecordings = async (): Promise<Recording[]> => {
  await delay(500);
  return [...mockRecordings];
};

export const getRecordingById = async (id: string): Promise<Recording | null> => {
  await delay(300);
  return mockRecordings.find((r) => r.id === id) || null;
};
