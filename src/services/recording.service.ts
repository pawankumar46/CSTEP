import { delay } from "@/lib/utils";
import { mockRecordings } from "@/mock/recordings";
import type { Recording } from "@/types";

export const getRecordings = async (): Promise<Recording[]> => {
  await delay(500);
  return [...mockRecordings];
};

export const getRecordingById = async (id: string): Promise<Recording | null> => {
  await delay(300);
  return mockRecordings.find((r) => r.id === id) || null;
};
