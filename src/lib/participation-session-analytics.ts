import type { DistributionDataPoint } from "@/types";

/** ICAS conference days for participation analytics day toggle. */
export const PARTICIPATION_ANALYTICS_DAY_DATES = [
  "2026-08-19",
  "2026-08-20",
  "2026-08-21",
] as const;

export type ParticipationAnalyticsDayDate =
  (typeof PARTICIPATION_ANALYTICS_DAY_DATES)[number];

export const PARTICIPATION_DURATION_BUCKETS = [
  "0-5",
  "5-10",
  "10-15",
  "15-20",
  "20-25",
  "25-30",
  "30-45",
  "45-60",
  "60-75",
  "75-90",
  "90-120",
] as const;

export type ParticipationDurationBucket =
  (typeof PARTICIPATION_DURATION_BUCKETS)[number];

export interface SessionParticipationTimeRow {
  sessionId?: string;
  sessionName: string;
  sessionDurationMinutes: number;
  uniqueParticipants: number;
  /** Conference day (`YYYY-MM-DD`) when the live payload includes a date. */
  date?: string;
  /**
   * Live WS: minute keys matching session duration (`"5"`, `"10"`, … `"60"`).
   * Mock fixtures may use range labels (`"0-5"`, `"5-10"`, …).
   */
  buckets: Record<string, number>;
}

export interface SessionParticipationRateRow {
  sessionId?: string;
  sessionName: string;
  sessionDurationMinutes: number;
  /** Conference day (`YYYY-MM-DD`) when the live payload includes a date. */
  date?: string;
  /** Participant count keyed by clock slot label (e.g. `"9:00"`). */
  slots: Record<string, number>;
}

export interface SessionParticipationDayData {
  date: ParticipationAnalyticsDayDate;
  timeRows: SessionParticipationTimeRow[];
  rateRows: SessionParticipationRateRow[];
  /** Ordered time-slot column headers for the rate table that day. */
  rateSlotLabels: string[];
}

function emptyBuckets(
  overrides: Partial<Record<ParticipationDurationBucket, number>> = {},
): Record<ParticipationDurationBucket, number> {
  const buckets = {} as Record<ParticipationDurationBucket, number>;
  for (const key of PARTICIPATION_DURATION_BUCKETS) {
    buckets[key] = overrides[key] ?? 0;
  }
  return buckets;
}

/** Placeholder UI data until live session participation APIs ship. */
export const MOCK_SESSION_PARTICIPATION_BY_DAY: SessionParticipationDayData[] = [
  {
    date: "2026-08-19",
    rateSlotLabels: ["9:00", "9:15", "9:30", "10:00", "10:15", "10:30", "10:45", "11:00"],
    timeRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        uniqueParticipants: 100,
        buckets: emptyBuckets({
          "0-5": 10,
          "5-10": 20,
          "10-15": 30,
          "15-20": 40,
          "20-25": 50,
          "25-30": 60,
          "30-45": 70,
        }),
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        uniqueParticipants: 200,
        buckets: emptyBuckets({
          "0-5": 5,
          "5-10": 6,
          "10-15": 7,
          "15-20": 8,
          "20-25": 9,
          "25-30": 10,
          "30-45": 11,
          "45-60": 12,
        }),
      },
      {
        sessionName: "Session 3 Name",
        sessionDurationMinutes: 90,
        uniqueParticipants: 300,
        buckets: emptyBuckets({
          "0-5": 13,
          "5-10": 14,
          "10-15": 15,
          "15-20": 16,
          "20-25": 17,
          "25-30": 18,
          "30-45": 19,
          "45-60": 20,
          "60-75": 21,
          "75-90": 22,
        }),
      },
    ],
    rateRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        slots: { "9:00": 120, "9:15": 110, "9:30": 105 },
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        slots: { "10:00": 200, "10:15": 200, "10:30": 200, "10:45": 200 },
      },
      {
        sessionName: "Session 3 Name",
        sessionDurationMinutes: 90,
        slots: {
          "10:00": 15,
          "10:15": 16,
          "10:30": 17,
          "10:45": 18,
          "11:00": 19,
        },
      },
    ],
  },
  {
    date: "2026-08-20",
    rateSlotLabels: [
      "9:00",
      "9:15",
      "9:30",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:30",
      "11:45",
      "12:00",
      "12:15",
      "12:30",
      "12:45",
    ],
    timeRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        uniqueParticipants: 100,
        buckets: emptyBuckets({
          "0-5": 10,
          "5-10": 20,
          "10-15": 30,
          "15-20": 40,
          "20-25": 50,
          "25-30": 60,
          "30-45": 70,
        }),
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        uniqueParticipants: 200,
        buckets: emptyBuckets({
          "0-5": 5,
          "5-10": 6,
          "10-15": 7,
          "15-20": 8,
          "20-25": 9,
          "25-30": 10,
          "30-45": 11,
          "45-60": 12,
        }),
      },
      {
        sessionName: "Session 3 Name",
        sessionDurationMinutes: 90,
        uniqueParticipants: 300,
        buckets: emptyBuckets({
          "0-5": 13,
          "5-10": 14,
          "10-15": 15,
          "15-20": 16,
          "20-25": 17,
          "25-30": 18,
          "30-45": 19,
          "45-60": 20,
          "60-75": 21,
          "75-90": 22,
        }),
      },
    ],
    rateRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        slots: { "9:00": 120, "9:15": 110, "9:30": 105 },
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        slots: { "10:00": 200, "10:15": 200, "10:30": 200, "10:45": 200 },
      },
      {
        sessionName: "Session 3 Name",
        sessionDurationMinutes: 90,
        slots: {
          "10:00": 15,
          "10:15": 16,
          "10:30": 17,
          "10:45": 18,
          "11:30": 19,
          "11:45": 20,
          "12:00": 21,
          "12:15": 22,
          "12:30": 23,
          "12:45": 24,
        },
      },
    ],
  },
  {
    date: "2026-08-21",
    rateSlotLabels: ["9:00", "9:15", "9:30", "10:00", "10:15", "10:30", "11:00", "11:15"],
    timeRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        uniqueParticipants: 80,
        buckets: emptyBuckets({
          "0-5": 8,
          "5-10": 12,
          "10-15": 16,
          "15-20": 20,
          "20-25": 24,
          "25-30": 28,
          "30-45": 32,
        }),
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        uniqueParticipants: 150,
        buckets: emptyBuckets({
          "0-5": 4,
          "5-10": 5,
          "10-15": 6,
          "15-20": 7,
          "20-25": 8,
          "25-30": 9,
          "30-45": 10,
          "45-60": 11,
        }),
      },
    ],
    rateRows: [
      {
        sessionName: "Session 1 Name",
        sessionDurationMinutes: 45,
        slots: { "9:00": 90, "9:15": 85, "9:30": 80 },
      },
      {
        sessionName: "Session 2 Name",
        sessionDurationMinutes: 60,
        slots: { "10:00": 140, "10:15": 135, "10:30": 130, "11:00": 120, "11:15": 110 },
      },
    ],
  },
];

export function getSessionParticipationForDay(
  date: ParticipationAnalyticsDayDate,
): SessionParticipationDayData {
  return (
    MOCK_SESSION_PARTICIPATION_BY_DAY.find((day) => day.date === date)
    ?? MOCK_SESSION_PARTICIPATION_BY_DAY[1]
  );
}

/** Merge mock fixtures across all conference days (sample UI when All is selected). */
export function getSessionParticipationForAllDays(): SessionParticipationDayData {
  const timeRows: SessionParticipationTimeRow[] = [];
  const rateRows: SessionParticipationRateRow[] = [];
  const rateSlotLabelSet = new Set<string>();

  for (const day of MOCK_SESSION_PARTICIPATION_BY_DAY) {
    timeRows.push(
      ...day.timeRows.map((row) => ({
        ...row,
        date: row.date ?? day.date,
      })),
    );
    rateRows.push(
      ...day.rateRows.map((row) => ({
        ...row,
        date: row.date ?? day.date,
      })),
    );
    for (const label of day.rateSlotLabels) rateSlotLabelSet.add(label);
  }

  return {
    date: PARTICIPATION_ANALYTICS_DAY_DATES[0],
    timeRows,
    rateRows,
    rateSlotLabels: [...rateSlotLabelSet].sort((a, b) => a.localeCompare(b)),
  };
}

export function participationSessionRowKey(
  row: { sessionId?: string; date?: string; sessionName: string },
  index: number,
): string {
  if (row.sessionId) {
    return `${row.date ?? "all"}-${row.sessionId}`;
  }
  return `${row.date ?? "all"}-${row.sessionName}-${index}`;
}

export function filterParticipationRowsByDay<T extends { date?: string }>(
  rows: T[],
  day: string,
): T[] {
  if (!rows.some((row) => Boolean(row.date))) return rows;
  return rows.filter((row) => row.date === day);
}

export function sumParticipationTimeTotals(
  rows: SessionParticipationTimeRow[],
  bucketLabels: readonly string[] = PARTICIPATION_DURATION_BUCKETS,
): {
  sessionDurationMinutes: number;
  uniqueParticipants: number;
  buckets: Record<string, number>;
} {
  const buckets: Record<string, number> = {};
  for (const key of bucketLabels) buckets[key] = 0;
  let sessionDurationMinutes = 0;
  let uniqueParticipants = 0;
  for (const row of rows) {
    sessionDurationMinutes += row.sessionDurationMinutes;
    uniqueParticipants += row.uniqueParticipants;
    for (const key of bucketLabels) {
      if (key in row.buckets) buckets[key] += row.buckets[key] ?? 0;
    }
  }
  return { sessionDurationMinutes, uniqueParticipants, buckets };
}

/** Flatten duration buckets for a simple bar preview (optional charts later). */
export function buildDurationBucketChart(
  rows: SessionParticipationTimeRow[],
  bucketLabels: readonly string[] = PARTICIPATION_DURATION_BUCKETS,
): DistributionDataPoint[] {
  const totals = sumParticipationTimeTotals(rows, bucketLabels);
  return bucketLabels.map((name) => ({
    name,
    value: totals.buckets[name] ?? 0,
  }));
}
