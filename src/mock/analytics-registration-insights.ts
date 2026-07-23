import type { ApiRegistrationInsights } from "@/lib/analytics-api-contract";

/** Demo Registration Insights until BE returns `registration_insights`. */
export const MOCK_REGISTRATION_INSIGHTS: ApiRegistrationInsights = {
  by_day_last_7: (() => {
    const today = new Date();
    const counts = [2, 5, 3, 8, 6, 11, 4];
    return counts.map((count, index) => {
      const date = new Date(today);
      date.setHours(12, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      return {
        date: date.toISOString().slice(0, 10),
        count,
      };
    });
  })(),
  by_attendance_mode: {
    PHYSICAL: 45,
    VIRTUAL: 16,
  },
  by_state: {
    Karnataka: 14,
    Maharashtra: 8,
    Delhi: 5,
    TamilNadu: 4,
    Telangana: 3,
    Kerala: 2,
    Gujarat: 2,
    Rajasthan: 1,
  },
  by_gender: {
    MALE: 18,
    FEMALE: 12,
    OTHER: 2,
  },
  by_designation: {
    Researcher: 10,
    Student: 8,
    "Policy Analyst": 5,
    Engineer: 4,
    "Program Manager": 3,
    Consultant: 2,
  },
};
