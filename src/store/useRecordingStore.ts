import { create } from "zustand";
import * as recordingService from "@/services/recording.service";
import type { Recording } from "@/types";

interface RecordingState {
  recordings: Recording[];
  isLoading: boolean;
  error: string | null;
  fetchRecordings: () => Promise<void>;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  recordings: [],
  isLoading: false,
  error: null,

  fetchRecordings: async () => {
    set({ isLoading: true, error: null });
    try {
      const recordings = await recordingService.getRecordings();
      set({ recordings, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch recordings",
        isLoading: false,
      });
    }
  },
}));
